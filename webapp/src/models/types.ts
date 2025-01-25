export interface ModelInfo {
    modelName: string | null;
    modelSha: string | null;
    modelDtype: string | null;
    modelSize: string | null;
}

export interface EvaluationLog {
    prompt: string;
    predictedAnswer: string;
    choices?: string[];
    expectedAnswer: string;
    isCorrect: boolean;
    latency: number;      // in milliseconds
    tokenCount: number;   // number of tokens processed
    type?: 'math' | 'multiple-choice';  // Make it optional with possible values
    question?: string;    // Optional question field
}

export interface EvaluationMetrics {
    latency: number;
    accuracy: number;
    tokensProcessed: number;
    memoryUsage: number;
    evalTime: number;
    logs?: EvaluationLog[];
}

export interface Model {
    modelInfo: ModelInfo;
    generate(context: string, options?: GenerationOptions): Promise<string>;
    evaluate(dataset: string): Promise<EvaluationMetrics>;
    cleanup(): void;
}

export interface GenerationOptions {
    stopSequence?: string[];
    generationSize?: number;
    doSample?: boolean;
} 