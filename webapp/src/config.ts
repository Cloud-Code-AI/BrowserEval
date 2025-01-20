export interface GenerationParameters {
    temperature?: number;
    top_k?: number;
    top_p?: number;
    n_samples?: number;
    eos?: string;
    seed?: number;
    use_cache?: boolean;
}

export enum ParallelismManager {
    ACCELERATE,
    NANOTRON,
    TGI,
    OPENAI,
    VLLM,
    NONE
}

export interface EnvConfig {
    token?: string | null;
    cacheDir?: string | null;
}

export interface PipelineParameters {
    launcherType: ParallelismManager;
    envConfig?: EnvConfig;
    jobId?: number;
    datasetLoadingProcesses?: number;
    nanotronCheckpointPath?: string | null;
    customTasksDirectory?: string | null;
    overrideBatchSize?: number | null;
    numFewshotSeeds?: number;
    maxSamples?: number | null;
    useChatTemplate?: boolean;
    systemPrompt?: string | null;
   numDatasetSplits?:number
}

export interface EvaluationTracker {
    generalConfigLogger: GeneralConfigLogger;
    metricsLogger: MetricsLogger;
    taskConfigLogger: TaskConfigLogger;
    detailsLogger: DetailsLogger;
    final_dict?: any;
    generateFinalDict(): void;
    save(): void;
}

export interface GeneralConfigLogger {
    lightevalSha: string;
    numFewshotSeeds: number | null;
    overrideBatchSize: number | null;
    maxSamples: number | null;
    jobId: number | null;
    startTime: number;
    endTime: number | null;
    totalEvaluationTimeSecondes: string | null;
    modelName: string | null;
    modelSha: string | null;
    modelDtype: string | null;
    modelSize: string | null;

      logArgsInfo(args : { numFewshotSeeds:number, overrideBatchSize: number| null, maxSamples : number|null, jobId?:number}): void
    logModelInfo(args : { modelName: string, modelSha: string | null, modelDtype: string | null, modelSize: string | null }): void
    logEndTime(): void;
}

export interface MetricsLogger {
    metricsValues: Record<string, Record<string, number[]>>;
    metricAggregated: Record<string, Record<string, number>>;
    log(taskName: string, metrics: Record<string, number>): void;
    aggregate(taskDict: Record<string, any>): void;
}

export interface DetailsLogger {
    details: Record<string, any[]>;
    compiledDetails: Record<string, any>;
    compiledDetailsOverAllTasks: any;
    log(taskName: string, task: any, doc: any, response: any, metrics: Record<string, number>): void;
    aggregate(): void;
}

export interface TaskConfigLogger {
    tasksConfigs: Record<string, any>;
    log(taskDict: Record<string, any>): void;
}

export class EmptyEvaluationTracker implements EvaluationTracker {
    generalConfigLogger = new EmptyGeneralConfigLogger();
    metricsLogger = new EmptyMetricsLogger();
    taskConfigLogger = new EmptyTaskConfigLogger();
    detailsLogger = new EmptyDetailsLogger();
    final_dict= {}
    generateFinalDict = ()=>{ }
    save = ()=>{}
}

export class EmptyGeneralConfigLogger implements GeneralConfigLogger{
    lightevalSha = "";
    numFewshotSeeds= null;
    overrideBatchSize = null;
    maxSamples= null;
     jobId = null;
    startTime = 0;
    endTime = null;
    totalEvaluationTimeSecondes = null;
    modelName = null;
    modelSha = null
    modelDtype = null
    modelSize = null;

    logArgsInfo = (args : { numFewshotSeeds:number, overrideBatchSize: number| null, maxSamples : number|null, jobId?:number}) =>{
        console.log("logging config", args)
    }
    logModelInfo = (args : { modelName: string, modelSha: string | null, modelDtype: string | null, modelSize: string | null }) =>{
        console.log("model info", args)
    }
    logEndTime = () => { }

}

 export class EmptyMetricsLogger implements MetricsLogger{
    metricsValues: Record<string, Record<string, number[]>> = {}
     metricAggregated: Record<string, Record<string, number>> = {}
    log(taskName: string, metrics: Record<string, number>): void {
     console.log("logging metrics", taskName, metrics)
    }
     aggregate(taskDict: Record<string, any>): void {
      console.log("aggregating metrics", taskDict)
    }

}

export class EmptyDetailsLogger implements DetailsLogger{
    details : Record<string, any[]> = {}
        compiledDetails : Record<string, any> = {}
         compiledDetailsOverAllTasks : any = {}
    log(taskName: string, task:any, doc:any, response: any, metrics: Record<string, number>): void {
        console.log("logging details", taskName, task, doc, response, metrics)
    }
      aggregate(): void {
        console.log("aggregate details")
    }
}

export class EmptyTaskConfigLogger implements TaskConfigLogger{
    tasksConfigs : Record<string, any> = {}
    log(taskDict: Record<string, any>): void {
         console.log("logging config", taskDict)
    }
}