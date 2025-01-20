import { BrowserAI } from "@browserai/browserai";
import { Model, ModelInfo, GenerationOptions, EvaluationMetrics, EvaluationLog } from "./types";


export interface BrowserAIConfig {
    model: string;
}

export class BrowserAIModel implements Model {
    modelInfo: ModelInfo;
    private browserAI: BrowserAI;
    private modelConfig: BrowserAIConfig;
    private modelLoaded: boolean = false;
    private evaluationCallbacks?: {
        onProgress: (progress: number, metrics: EvaluationMetrics) => void;
        onComplete: (metrics: EvaluationMetrics) => void;
        onLog: (message: string, type: "info" | "error" | "success", clear?: boolean) => void;
    };

    constructor(modelConfig: BrowserAIConfig, callbacks?: typeof this.evaluationCallbacks) {
        this.modelConfig = modelConfig;
        this.modelInfo = {
            modelName: modelConfig.model,
            modelSha: null,
            modelDtype: null,
            modelSize: null
        };
        this.browserAI = new BrowserAI();
        this.evaluationCallbacks = callbacks;
        console.log("Model loaded: ", this.modelConfig.model);
    }

    async generate(context: string, options?: GenerationOptions): Promise<string> {
        if (!this.modelLoaded) {
            console.log("Loading model...");
            await this.browserAI.loadModel(this.modelConfig.model);
            this.modelLoaded = true;
        }

        return await this.browserAI.generateText(context, {
            stopSequence: options?.stopSequence,
            generationSize: options?.generationSize,
            doSample: options?.doSample
        }) as string;
    }

    async evaluate(dataset: string): Promise<EvaluationMetrics> {
        this.evaluationCallbacks?.onLog("", "info", true);

        if (!this.modelLoaded) {
            this.evaluationCallbacks?.onLog("Loading model...", "info");
            await this.browserAI.loadModel(this.modelConfig.model);
            this.modelLoaded = true;
        }

        this.evaluationCallbacks?.onLog(`Starting evaluation on dataset: ${dataset}`, "info");
        try {
            const startTime = Date.now();
            let correctAnswers = 0;
            let totalTokens = 0;
            const evaluationLogs: EvaluationLog[] = [];
            
            // Fetch dataset from Hugging Face with JSONL format
            const [repo_name, file_name] = dataset.split(':');
            // const url = `https://huggingface.co/datasets/${repo_name}/resolve/main/${file_name}/test-00000-of-00001.parquet`;
            const url = `https://raw.githubusercontent.com/Cloud-Code-AI/smalleval/refs/heads/main/generate_dataset/datasets/${file_name}`
            console.log("Fetching dataset from: ", url);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch dataset: ${response.statusText}`);
            }

            const text = await response.text();
            const examples = text
                .trim()
                .split('\n')
                .map(line => JSON.parse(line));
            
            for (let i = 0; i < examples.length; i++) {
                const example = examples[i];
                const prompt = `Just reply with the letter of the answer, no other text. Question: ${example.question}\nChoices:\nA) ${example.choices[0]}\nB) ${example.choices[1]}\nC) ${example.choices[2]}\nD) ${example.choices[3]}\nAnswer:`;
                console.log("Prompt: ", prompt);
                const response = await this.generate(prompt);
                console.log("Response: ", response);

                // Improved answer extraction
                const cleanResponse = response.trim().toUpperCase();
                let predictedAnswer = '';

                // Try multiple matching patterns
                if (cleanResponse.length === 1) {
                    if (/[ABCD]/.test(cleanResponse)) {
                        // Single letter response
                        predictedAnswer = cleanResponse;
                    } else if (/[1234]/.test(cleanResponse)) {
                        // Convert numeric answer to letter
                        predictedAnswer = String.fromCharCode(64 + parseInt(cleanResponse)); // 1->A, 2->B, etc.
                    }
                } else {
                    // Look for patterns like "A", "A)", "A.", "(A)", "1", "1)", etc.
                    const letterMatch = cleanResponse.match(/^[^ABCD]*([ABCD])(?:\)|\.|\s|$)/);
                    const numberMatch = cleanResponse.match(/^[^1234]*([1234])(?:\)|\.|\s|$)/);
                    
                    if (letterMatch) {
                        predictedAnswer = letterMatch[1];
                    } else if (numberMatch) {
                        predictedAnswer = String.fromCharCode(64 + parseInt(numberMatch[1]));
                    }
                }

                // Debug log to see what we're getting
                console.log("Raw example answer:", example.answer, "Type:", typeof example.answer);

                // Convert example.answer from number to letter for comparison
                const answerNum = parseInt(example.answer, 10); // Explicitly use base 10
                if (isNaN(answerNum) || answerNum < 0 || answerNum > 3) {
                    console.error("Invalid answer number:", example.answer);
                    predictedAnswer = ''; // or handle error as needed
                }
                const expectedAnswer = String.fromCharCode(65 + answerNum);
                console.log("Predicted Answer: ", predictedAnswer, "Example Answer: ", expectedAnswer);
                const isCorrect = predictedAnswer === expectedAnswer;
                if (isCorrect) correctAnswers++;
                totalTokens += prompt.length + response.length;

                // Store the evaluation log
                evaluationLogs.push({
                    prompt,
                    predictedAnswer,
                    expectedAnswer,
                    isCorrect
                });

                const progress = ((i + 1) / examples.length) * 100;
                const currentMetrics: EvaluationMetrics = {
                    latency: totalTokens * 1000 / (Date.now() - startTime),
                    accuracy: correctAnswers / (i + 1),
                    tokensProcessed: totalTokens,
                    memoryUsage: performance.memory?.usedJSHeapSize || 0,
                    evalTime: (Date.now() - startTime) / 1000,
                    logs: evaluationLogs
                };

                this.evaluationCallbacks?.onProgress(progress, currentMetrics);
                this.evaluationCallbacks?.onLog(`Processed ${i + 1}/${examples.length} examples`, "info");
                
                if (i === examples.length - 1) {
                    this.evaluationCallbacks?.onLog("Evaluation complete!", "success");
                    this.evaluationCallbacks?.onComplete(currentMetrics);
                    return currentMetrics;
                }
            }

            throw new Error("Evaluation failed to complete");
        } catch (error) {
            this.evaluationCallbacks?.onLog(`Evaluation error: ${error.message}`, "error");
            throw error;
        }
    }

    cleanup(): void {
        this.modelLoaded = false;
        console.log("Cleaned up Browser AI model");
    }
} 