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
            
            const [repo_name, file_name] = dataset.split(':');
            //const url = `https://raw.githubusercontent.com/Cloud-Code-AI/smalleval/refs/heads/main/generate_dataset/datasets/${file_name}`
            const url = `https://raw.githubusercontent.com/manmohan659/smalleval/add-evaluation-datasets/generate_dataset/datasets/${file_name}`;
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
                let prompt = '';
                let choices: string[] = [];
                let expectedAnswer = '';
                
                // Determine the dataset type and format accordingly
                if (example.choices && Array.isArray(example.choices)) {
                    // TruthfulQA format
                    choices = example.choices;
                    prompt = `Question: ${example.question}\nChoices:\nA) ${choices[0]}\nB) ${choices[1]}\nAnswer:`;
                    expectedAnswer = String.fromCharCode(65 + example.gold_index); // Convert 0 to 'A', 1 to 'B'
                } else if (example.choices && example.choices.text) {
                    // ARC format
                    choices = example.choices.text;
                    prompt = `Question: ${example.question}\nChoices:\nA) ${choices[0]}\nB) ${choices[1]}\nC) ${choices[2]}\nD) ${choices[3]}\nAnswer:`;
                    expectedAnswer = example.answerKey;
                } else if(example.answer && example.equation) {
                    // MathQA format
                    prompt = `Question: ${example.question}\nProvide only the numeric answer, no explanation:`;
                    expectedAnswer = example.answer;
                }
    
                console.log("Processing example:", {
                    question: example.question,
                    choices: choices,
                    expectedAnswer: expectedAnswer
                });
    
                const response = await this.generate(prompt);
                console.log("Model response:", response);
    
                let predictedAnswer = '';
                let isCorrect = false;
    
                if (example.answer && example.equation) {
                    // For MathQA, extract and compare numerical answers
                    const numberMatch = response.match(/[-+]?(\d*\.\d+|\d+)/);
                    if (numberMatch) {
                        const numericResponse = parseFloat(numberMatch[0]);
                        const expectedNumeric = parseFloat(expectedAnswer);
                        isCorrect = Math.abs(numericResponse - expectedNumeric) < 0.01; // Allow small difference
                        predictedAnswer = numericResponse.toString();
                    } else {
                        predictedAnswer = "No numeric answer found";
                        isCorrect = false;
                    }
                } else {
                    // For multiple choice questions
                    const cleanResponse = response.trim().toUpperCase();
                    if (/[ABCD]/.test(cleanResponse)) {
                        predictedAnswer = cleanResponse[0];
                        isCorrect = predictedAnswer === expectedAnswer;
                    }
                }
    
                if (isCorrect) correctAnswers++;
                totalTokens += prompt.length + response.length;
    
                evaluationLogs.push({
                    prompt,
                    predictedAnswer,
                    expectedAnswer,
                    isCorrect,
                    choices: choices,
                    question: example.question,
                    type: example.answer && example.equation ? 'math' : 'multiple-choice',
                    latency: totalTokens * 1000 / (Date.now() - startTime),  // Calculate latency
                    tokenCount: prompt.length + response.length  // Add token count
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