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
    }

    async generate(context: string, options?: GenerationOptions): Promise<string> {
        if (!this.modelLoaded) {
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
            
            // Read from local datasets folder
            const response = await fetch(`/datasets/${dataset.split(':')[1]}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load dataset: ${response.statusText}`);
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
                let type: 'math' | 'multiple-choice' = 'multiple-choice';

                if (example.gold_index !== undefined && Array.isArray(example.choices)) {
                    // TruthfulQA format
                    choices = example.choices;
                    prompt = `Please answer the following question based on the provided choices. Always start with answer. Output format: <<Label>>. Question: ${example.question}\nChoices:\nA) ${choices[0]}\nB) ${choices[1]}\nAnswer: : Option <<Label>>`;
                    expectedAnswer = String.fromCharCode(65 + example.gold_index);
                } else if (example.choices && example.choices.text) {
                    // ARC format
                    choices = example.choices.text;
                    prompt = `Please answer the following question based on the provided choices. Always start with answer. Output format: <<Label>>. Question: ${example.question}\nChoices:\nA) ${choices[0]}\nB) ${choices[1]}\nC) ${choices[2]}\nD) ${choices[3]}\nAnswer: Option <<Label>>`;
                    expectedAnswer = example.answerKey;
                } else if (example.answer && example.equation) {
                    // MathQA format
                    type = 'math';
                    prompt = `Question: ${example.question}\nProvide only the numeric answer, no explanation:`;
                    expectedAnswer = example.answer;
                } else if (Array.isArray(example.choices) && typeof example.answer === 'number') {
                    // Standard multiple choice format
                    choices = example.choices;
                    prompt = `Please answer the following question based on the provided choices. Always start with answer. Output format: <<Label>>. Question: ${example.question}\nChoices:\n` + 
                        choices.map((choice, idx) => `${String.fromCharCode(65 + idx)}) ${choice}`).join('\n') + 
                        '\nAnswer: Option <<Label>>';
                    expectedAnswer = String.fromCharCode(65 + example.answer);
                }
    
                const response = await this.generate(prompt);
                let predictedAnswer = '';
                let isCorrect = false;
                console.log(prompt, response);
                if (type === 'math') {
                    const numberMatch = response.match(/[-+]?(\d*\.\d+|\d+)/);
                    if (numberMatch) {
                        const numericResponse = parseFloat(numberMatch[0]);
                        const expectedNumeric = parseFloat(expectedAnswer);
                        isCorrect = Math.abs(numericResponse - expectedNumeric) < 0.01;
                        predictedAnswer = numericResponse.toString();
                    } else {
                        predictedAnswer = "No numeric answer found";
                        isCorrect = false;
                    }
                } else {
                    const cleanResponse = response.trim().toUpperCase();
                    if (/[ABCD]/.test(cleanResponse)) {
                        predictedAnswer = cleanResponse[0];
                        isCorrect = predictedAnswer === expectedAnswer;
                    }
                }
    
                if (isCorrect) correctAnswers++;
                totalTokens += (prompt.length + response.length) / 4;
                
                evaluationLogs.push({
                    prompt,
                    predictedAnswer,
                    expectedAnswer,
                    isCorrect,
                    choices,
                    question: example.question,
                    type,
                    subject: example.subject,
                    latency: totalTokens * 1000 / (Date.now() - startTime),
                    tokenCount: prompt.length + response.length
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
                this.evaluationCallbacks?.onLog(`Processed ${i + 1}/${examples.length} examples | Accuracy: ${currentMetrics.accuracy.toFixed(2)} | Latency: ${currentMetrics.latency.toFixed(2)}ms | Tokens Processed: ${currentMetrics.tokensProcessed} | Eval Time: ${currentMetrics.evalTime.toFixed(2)}s`, "info");
                
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
    }
}