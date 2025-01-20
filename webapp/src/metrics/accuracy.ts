import { Metric, MetricCategory } from "./metrics";
import { Doc } from "../core/task";
import { safeDivide } from "../core/utils";
import { ModelResponse } from "../core/model";


export class ExactMatchMetric implements Metric {
    metricName: string = "exact_match";
    category: MetricCategory = MetricCategory.GENERATIVE;
  
    compute(gold: string, prediction: string, formatted_doc?: Doc): number {
        return gold === prediction ? 1 : 0;
    }
}

export class F1ScoreMetric implements Metric {
    metricName: string = "f1_score";
    category: MetricCategory = MetricCategory.GENERATIVE;
    compute(gold: string, prediction: string, formatted_doc?: Doc): number {
         const goldBag = new Set(gold.split(" "));
         const predBag = new Set(prediction.split(" "));
          const intersection = new Set([...goldBag].filter(x => predBag.has(x))).size;
        const precision = safeDivide(intersection,predBag.size)
         const recall = safeDivide(intersection,goldBag.size);
           if (precision === 0 && recall === 0) {
            return 0;
        }
           return (2 * precision * recall) / (precision + recall)
    }
}

 export class LoglikelihoodAccuracy implements Metric {
    metricName: string = "acc";
    category: MetricCategory = MetricCategory.MULTICHOICE;
       compute(gold_ixs: number[], choices_logprob: number[]): number {
            const best_choice = choices_logprob.indexOf(Math.max(...choices_logprob));
            return gold_ixs.includes(best_choice) ? 1 : 0;
        }
}

  export class RecallAtK implements Metric {
        metricName: string;
        category: MetricCategory = MetricCategory.MULTICHOICE;
          k:number
      constructor(k: number){
        this.k = k;
          this.metricName = `recall@${k}`
      }
      compute(gold_ixs: number[], choices_logprob: number[]): number {
            const sorted_choices = [...choices_logprob]
               .map((value, index) => ({ value, index }))
            .sort((a, b) => b.value - a.value)
                .map(i=> i.index)


        for (let i =0; i < this.k; i++) {
            if (gold_ixs.includes(sorted_choices[i])){
                return 1
            }
        }
        return 0;

      }
}

  export class MRR implements Metric {
    metricName: string = "mrr";
    category: MetricCategory = MetricCategory.MULTICHOICE;
    compute(gold_ixs: number[], choices_logprob: number[],formatted_doc?:Doc): number {
      const rankedChoices = gold_ixs.map((g) => {
            return  [...choices_logprob].sort((a,b)=> b-a).indexOf(choices_logprob[g])

        })
         return safeDivide(1 , (Math.min(...rankedChoices) + 1))

        }
}