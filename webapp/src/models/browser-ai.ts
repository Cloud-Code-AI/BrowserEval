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
            let malformedResponses = 0;
            const evaluationLogs: EvaluationLog[] = [];
            
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
                let predictedAnswer = '';
                let choices: string[] = [];
                let rawResponse = '';
                let expectedAnswer = '';
                let isCorrect = false;
                let type: 'math' | 'multiple-choice' | 'text' | 'free-form' = 'multiple-choice';
    
                // Handle free-form prompts separately
                if (example.prompt) {
                    type = 'free-form';
                    prompt = example.prompt;
                    
                    // Generate response for free-form
                    rawResponse = await this.generate(prompt);
                    predictedAnswer = rawResponse;
                    
                    // Initialize as correct and check all requirements
                    isCorrect = true;
                    const requirements: string[] = [];
    
                    // Process each instruction and its corresponding kwargs
                    if (example.instruction_id_list) {
                        example.instruction_id_list.forEach((instruction: string, index: number) => {
                            const kwargs = example.kwargs?.[index] || {};
                            
                            if (instruction === 'detectable_content:postscript' && kwargs.postscript_marker) {
                                requirements.push(`Must include: ${kwargs.postscript_marker}`);
                                if (!rawResponse.includes(kwargs.postscript_marker)) {
                                    isCorrect = false;
                                }
                            } else if (instruction === 'change_case:english_capital') {
                                requirements.push('Text must be in capital letters');
                                if (rawResponse !== rawResponse.toUpperCase()) {
                                    isCorrect = false;
                                }
                            } else if (instruction.startsWith('keywords:forbidden_words') && kwargs.forbidden_words) {
                                const forbiddenWords = kwargs.forbidden_words;
                                requirements.push(`Must not include: ${forbiddenWords.join(', ')}`);
                                if (forbiddenWords.some(word => rawResponse.toLowerCase().includes(word.toLowerCase()))) {
                                    isCorrect = false;
                                }
                            }
                        });
                        expectedAnswer = requirements.join(' AND ');
                    } else {
                        expectedAnswer = "Free-form response";
                    }
                } else {
                    // Handle other formats (multiple choice, math, etc.)
                    if (example.gold_index !== undefined && Array.isArray(example.choices)) {
                        // TruthfulQA format
                        choices = example.choices;
                        prompt = `Please answer the following question by selecting one choice. Your response must be in the format <<A>> or <<B>>.\nQuestion: ${example.question}\nChoices:\n<<A>> ${choices[0]}\n<<B>> ${choices[1]}\nAnswer: `;
                        expectedAnswer = String.fromCharCode(65 + example.gold_index);
                    } else if (example.choices && example.choices.text) {
                        // ARC format
                        choices = example.choices.text;
                        prompt = `Please answer the following question by selecting one choice. Your response must be in the format <<A>>, <<B>>, <<C>>, or <<D>>.\nQuestion: ${example.question}\nChoices:\n<<A>> ${choices[0]}\n<<B>> ${choices[1]}\n<<C>> ${choices[2]}\n<<D>> ${choices[3]}\nAnswer: `;
                        expectedAnswer = example.answerKey;
                    } else if (example.answer && example.equation) {
                        // MathQA format
                        type = 'math';
                        prompt = `Question: ${example.question}\nProvide the numeric answer in the format <<number>>:`;
                        expectedAnswer = example.answer;
                    } else if (Array.isArray(example.choices) && typeof example.answer === 'number') {
                        // Standard multiple choice format
                        choices = example.choices;
                        prompt = `Please answer the following question by selecting one choice. Your response must be in the format <<A>>, <<B>>, <<C>>, or <<D>>.\nQuestion: ${example.question}\nChoices:\n` + 
                            choices.map((choice, idx) => `<<${String.fromCharCode(65 + idx)}>> ${choice}`).join('\n') + 
                            '\nAnswer: ';
                        expectedAnswer = String.fromCharCode(65 + example.answer);
                    }
    
                    // Generate response for structured formats
                    rawResponse = await this.generate(prompt);
                    
                    if (type === 'math') {
                        const numberMatch = rawResponse.match(/<<([-+]?\d*\.?\d+)>>/);
                        if (numberMatch) {
                            const numericResponse = parseFloat(numberMatch[1]);
                            const expectedNumeric = parseFloat(expectedAnswer);
                            isCorrect = Math.abs(numericResponse - expectedNumeric) < 0.01;
                            predictedAnswer = numericResponse.toString();
                        } else {
                            predictedAnswer = "No properly formatted answer found";
                            isCorrect = false;
                            malformedResponses++;
                        }
                    } else {
                        const answerMatch = rawResponse.match(/<<([A-D])>>/i);
                        if (answerMatch) {
                            predictedAnswer = answerMatch[1].toUpperCase();
                            isCorrect = predictedAnswer === expectedAnswer;
                        } else {
                            predictedAnswer = "No properly formatted answer found";
                            isCorrect = false;
                            malformedResponses++;
                        }
                    }
                }
    
                if (isCorrect) correctAnswers++;
                totalTokens += (prompt.length + rawResponse.length) / 4;
                
                evaluationLogs.push({
                    prompt,
                    predictedAnswer,
                    expectedAnswer,
                    isCorrect,
                    choices,
                    question: prompt,  // Use prompt as question for display
                    type,
                    subject: example.key?.toString(),
                    latency: totalTokens * 1000 / (Date.now() - startTime),
                    tokenCount: prompt.length + rawResponse.length,
                    rawResponse // Add full response for context
                });
                
                const progress = ((i + 1) / examples.length) * 100;
                const currentMetrics: EvaluationMetrics = {
                    latency: totalTokens * 1000 / (Date.now() - startTime),
                    accuracy: correctAnswers / (i + 1),
                    tokensProcessed: totalTokens,
                    memoryUsage: performance.memory?.usedJSHeapSize || 0,
                    evalTime: (Date.now() - startTime) / 1000,
                    logs: evaluationLogs,
                    malformedResponses
                };
    
                this.evaluationCallbacks?.onProgress(progress, currentMetrics);
                this.evaluationCallbacks?.onLog(
                    `Processed ${i + 1}/${examples.length} examples | Accuracy: ${currentMetrics.accuracy.toFixed(2)} | ` +
                    `Latency: ${currentMetrics.latency.toFixed(2)}ms | Tokens Processed: ${currentMetrics.tokensProcessed} | ` +
                    `Eval Time: ${currentMetrics.evalTime.toFixed(2)}s | Malformed Responses: ${malformedResponses}`, 
                    "info"
                );
                
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

// Helper function to format choices
const formatChoices = (choices: string[], format: string): string => {
    return choices.map((choice, idx) => 
        `<<${String.fromCharCode(65 + idx)}>> ${choice}`).join('\n');
};

// Helper function to create consistent prompt structure
const createPrompt = (question: string, choices: string[], type: string, format: string = 'letter'): string => {
    const basePrompt = `Question: ${question.trim()}\n`;
    
    if (type === 'math') {
        return `${basePrompt}Provide your answer as a number in this format: <<number>>`;
    }
    
    const choiceCount = choices.length;
    const validFormats = Array.from({length: choiceCount}, (_, i) => 
        `<<${String.fromCharCode(65 + i)}>>`).join(', ');
        
    return `${basePrompt}Select the best answer. Respond ONLY with one of these formats: ${validFormats}

Choices:
${formatChoices(choices, format)}

Your answer: `;
};

// Main prompt generation logic
const generatePrompt = (example: any): { prompt: string; expectedAnswer: string } => {
    if (example.gold_index !== undefined && Array.isArray(example.choices)) {
        // TruthfulQA format
        return {
            prompt: createPrompt(example.question, example.choices, 'truthfulqa'),
            expectedAnswer: String.fromCharCode(65 + example.gold_index)
        };
    }
    
    if (example.choices?.text) {
        // ARC format
        return {
            prompt: createPrompt(example.question, example.choices.text, 'arc'),
            expectedAnswer: example.answerKey
        };
    }
    
    if (example.answer && example.equation) {
        // MathQA format
        return {
            prompt: createPrompt(example.question, [], 'math'),
            expectedAnswer: example.answer
        };
    }
    
    if (Array.isArray(example.choices) && typeof example.answer === 'number') {
        // Standard multiple choice
        return {
            prompt: createPrompt(example.question, example.choices, 'standard'),
            expectedAnswer: String.fromCharCode(65 + example.answer)
        };
    }
    
    throw new Error('Unsupported example format');
};