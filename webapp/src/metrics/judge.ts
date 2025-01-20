import { Metric, MetricCategory } from "./metrics";
import { Doc } from "../core/task";
import { formatString, sleep } from "../core/utils";
import { Model, ModelResponse } from "../core/model";

export interface JudgePromptTemplate {
  name: string;
  type: "single" | "pairwise";
  systemPrompt: string;
  promptTemplate: string;
  description: string;
  category: string;
  outputFormat: string;
}


// Helper function to parse the output
function process_judge_response(output: string, format : string): number {
    const match = output.match(/\[\[(\w+)\]\]/);
    if (match) {
      return Number(match[1])
    } else {
      return 0;
    }
  }



export class JudgeLLMMetric implements Metric{
    metricName: string;
    category: MetricCategory = MetricCategory.LLM_AS_JUDGE;
    judgePromptTemplate : JudgePromptTemplate
    shortJudgeName : string | null
    judgeModel: Model
    constructor(judgePromptTemplate: JudgePromptTemplate, judgeModel: Model, shortJudgeName: string|null = null){
         this.judgePromptTemplate = judgePromptTemplate;
        this.shortJudgeName = shortJudgeName;
          this.metricName = `judge_score_${this.shortJudgeName}`;
        this.judgeModel = judgeModel;
    }

      async compute(sampleIds: string[], responses: any[][], formatted_docs: Doc[]) : Promise<Record<string, number>[]> {

    
            const scores : Record<string, number>[] = []
              for (const [ix, doc] of formatted_docs.entries()){
              const response = responses[ix] as any[]
            
                const prediction = response[0].result;

           
               const prompt = this.formatPrompt(doc, prediction);
               const r =  (await this.judgeModel.generate([{
                    context :  prompt,
                    tokenizedContext: [],
                     generationSize: 512,
                    stopSequence: [],
                    doSample:false,
                     useLogits: false,

                }]))[0]
              const judgement = r.generated_text

                const score = process_judge_response(judgement, this.judgePromptTemplate.outputFormat)
                scores.push({[this.metricName]: score, "user_prompt": prompt, "judgement": judgement});
         }


        return scores;
    }

    protected formatPrompt(doc: Doc, answer: string): string {
        let formattedPrompt = this.judgePromptTemplate.promptTemplate;
    if (this.judgePromptTemplate.type === 'pairwise') {
        throw new Error ("Pairwise LLM as judge is not yet implemented.")
    }
       if (this.judgePromptTemplate.type === "single") {
            const refAnswer = doc.specific?.reference
            formattedPrompt = formattedPrompt.replace("{question}", doc.query);

           if (refAnswer){
                 formattedPrompt = formattedPrompt.replace("{ref_answer_1}", refAnswer);
            }
             formattedPrompt = formattedPrompt.replace("{answer}", answer);
         }

      return  `${this.judgePromptTemplate.systemPrompt}\n\n${formattedPrompt}`
    }


}

export class JudgeLLMMTBenchMetric implements Metric{
    metricName: string = "llm_judge";
        category: MetricCategory = MetricCategory.LLM_AS_JUDGE_MULTI_TURN;

    judgeModel: Model
       judgePromptTemplate : JudgePromptTemplate
        shortJudgeName: string | null;

    constructor(judgePromptTemplate: JudgePromptTemplate, judgeModel: Model, shortJudgeName: string|null = null){
      this.judgePromptTemplate = judgePromptTemplate;
        this.shortJudgeName = shortJudgeName;
        this.judgeModel = judgeModel;
       }

    async compute(sampleIds: string[], responses: any[][], formatted_docs: Doc[]): Promise<Record<string, number>[]> {
          const scores:  Record<string, number>[] = []
              for (const [ix, doc] of formatted_docs.entries()){
                   const response = responses[ix] as any[]
                      const prediction = response.map(r=> r.result[0])
               const prompt_1 = this.formatPrompt(doc, prediction[0], 1);
            const prompt_2 = this.formatPrompt(doc, prediction[1], 2);

                   const r1 = (await this.judgeModel.generate([{
                        context :  prompt_1,
                        tokenizedContext: [],
                        generationSize: 512,
                        stopSequence: [],
                        doSample:false,
                        useLogits: false
                    }]))[0]
                   const r2 = (await this.judgeModel.generate([{
                        context : prompt_2,
                         tokenizedContext: [],
                         generationSize: 512,
                         stopSequence: [],
                         doSample:false,
                         useLogits: false
                    }]))[0]
                const score_1 = process_judge_response(r1.generated_text, this.judgePromptTemplate.outputFormat)
                const score_2 = process_judge_response(r2.generated_text, this.judgePromptTemplate.outputFormat)
            scores.push({
                [`judge_score_turn_1_${this.shortJudgeName}`]: score_1,
                [`judge_score_turn_2_${this.shortJudgeName}`]: score_2,
                 "user_prompt" : [prompt_1, prompt_2],
                 "judgement" : [r1.generated_text, r2.generated_text]
            })
        }

         return scores;
    }


    protected formatPrompt(doc: Doc, answer: string, turn: number): string {
          let formattedPrompt = this.judgePromptTemplate.promptTemplate;
    if (this.judgePromptTemplate.type === 'pairwise') {
         throw new Error ("Pairwise LLM as judge is not yet implemented.")
    }
        if (this.judgePromptTemplate.type === "single") {
            const refAnswer = doc.specific?.reference
            const questions = doc.specific["multi_turn_queries"]
            formattedPrompt = formattedPrompt.replace("{question_1}", questions[0]);
              formattedPrompt = formattedPrompt.replace("{question_2}", questions[1]);
          if (refAnswer){
                  formattedPrompt = formattedPrompt.replace("{ref_answer_1}", refAnswer[0]);
                  formattedPrompt = formattedPrompt.replace("{ref_answer_2}", refAnswer[1]);
              }


                 formattedPrompt = formattedPrompt.replace("{answer_1}", doc.specific?.multi_turn_answers[0]);
            formattedPrompt = formattedPrompt.replace("{answer_2}", answer);
         }
           return  `${this.judgePromptTemplate.systemPrompt}\n\n${formattedPrompt}`
    }

}