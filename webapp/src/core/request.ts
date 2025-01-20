export enum MetricCategory {
    GENERATIVE,
    PERPLEXITY,
    MULTICHOICE,
    MULTICHOICE_ONE_TOKEN,
    MULTICHOICE_PMI,
     TARGET_PERPLEXITY,
      LLM_AS_JUDGE,
      LLM_AS_JUDGE_MULTI_TURN,
    IGNORED
}

export type SampleUid = {
    taskName: string;
    sampleIndex: number;
};


export interface Request {
    sampleUid: SampleUid;
     metricCategories: MetricCategory[];
}