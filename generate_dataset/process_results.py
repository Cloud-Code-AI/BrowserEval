import os
import json
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional

def extract_metrics(data: Dict) -> Dict:
    """Extract metrics from either format of JSON data."""
    metrics = data.get('metrics', {})
    
    # Base metrics that should be present in both formats
    result = {
        'latency': metrics.get('latency'),
        'accuracy': metrics.get('accuracy'),
        'tokens_processed': metrics.get('tokensProcessed'),
        'memory_usage_mb': metrics.get('memoryUsage', 0) / (1024 * 1024),
        'eval_time': metrics.get('evalTime')
    }
    
    # Extract system info if available
    system_info = data.get('systemInfo', {})
    result.update({
        'system_os': system_info.get('os'),
        'system_cpu': system_info.get('cpu'),
        'system_browser': system_info.get('browser'),
        'system_ram': system_info.get('ram')
    })
    
    return result

def create_logs_dataframe(data: Dict) -> Optional[pd.DataFrame]:
    """Create a separate DataFrame for evaluation logs if present."""
    if 'metrics' in data and 'logs' in data['metrics']:
        logs = data['metrics']['logs']
        logs_df = pd.DataFrame(logs)
        
        # Add identification columns
        if 'timestamp' in data:
            logs_df['timestamp'] = data['timestamp']
        if 'model' in data:
            logs_df['model'] = data['model']
        if 'dataset' in data:
            logs_df['dataset'] = data['dataset']
            
        return logs_df
    return None

def read_json_file(filepath: str) -> tuple[Dict, Optional[pd.DataFrame]]:
    """Read a JSON file and extract both metrics and logs."""
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    # Extract base information
    base_info = {
        'filename': os.path.basename(filepath),
        'timestamp': data.get('timestamp', datetime.now().isoformat()),
        'model': data.get('model', 'unknown'),
        'dataset': data.get('dataset', 'unknown')
    }
    
    # Extract metrics
    metrics = extract_metrics(data)
    
    # Combine base info and metrics
    result = {**base_info, **metrics}
    
    # Extract logs if present
    logs_df = create_logs_dataframe(data)
    
    return result, logs_df

def process_results_directory(directory_path: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Process all JSON files in the directory and create DataFrames."""
    metrics_rows = []
    logs_dfs = []
    
    # Process each JSON file in the directory
    for filename in os.listdir(directory_path):
        if filename.endswith('.json'):
            filepath = os.path.join(directory_path, filename)
            try:
                metrics_row, logs_df = read_json_file(filepath)
                metrics_rows.append(metrics_row)
                if logs_df is not None:
                    logs_dfs.append(logs_df)
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")
    
    # Create main metrics DataFrame
    metrics_df = pd.DataFrame(metrics_rows)
    
    # Create logs DataFrame
    logs_df = pd.concat(logs_dfs, ignore_index=True) if logs_dfs else pd.DataFrame()
    
    return metrics_df, logs_df

def create_summary_df(df: pd.DataFrame) -> pd.DataFrame:
    """Create a summary DataFrame grouped by model and dataset."""
    summary_df = df.groupby(['model', 'dataset']).agg({
        'accuracy': ['mean', 'std', 'count'],
        'latency': ['mean', 'std'],
        'tokens_processed': 'mean',
        'memory_usage_mb': 'mean',
        'eval_time': 'mean'
    }).round(4)
    
    # Flatten column names
    summary_df.columns = [f"{col[0]}_{col[1]}" if col[1] else col[0] 
                         for col in summary_df.columns]
    
    return summary_df

def main():
    # Set paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    results_dir = os.path.normpath(os.path.join(script_dir, "..", "webapp", "public", "results"))
    output_dir = os.path.normpath(os.path.join(script_dir, "..", "webapp", "public", "processed_results"))
    os.makedirs(output_dir, exist_ok=True)
    
    # Process all results
    print("Processing evaluation results...")
    metrics_df, logs_df = process_results_directory(results_dir)
    
    # Save raw metrics results
    raw_metrics_path = os.path.join(output_dir, "raw_metrics.csv")
    metrics_df.to_csv(raw_metrics_path, index=False)
    print(f"Raw metrics saved to: {raw_metrics_path}")
    
    # Save logs if available
    if not logs_df.empty:
        logs_path = os.path.join(output_dir, "evaluation_logs.csv")
        logs_df.to_csv(logs_path, index=False)
        print(f"Evaluation logs saved to: {logs_path}")
    
    # Create and save summary
    summary_df = create_summary_df(metrics_df)
    summary_output_path = os.path.join(output_dir, "summary_results.csv")
    summary_df.to_csv(summary_output_path)
    print(f"Summary results saved to: {summary_output_path}")
    
    # Print basic statistics
    print("\nBasic Statistics:")
    print(f"Total evaluations processed: {len(metrics_df)}")
    print(f"Number of unique models: {metrics_df['model'].nunique()}")
    print(f"Number of unique datasets: {metrics_df['dataset'].nunique()}")
    
    # Print average accuracy by model
    print("\nAverage Accuracy by Model:")
    model_accuracy = metrics_df.groupby('model')['accuracy'].mean().sort_values(ascending=False)
    print(model_accuracy)
    
    # Print average accuracy by dataset
    print("\nAverage Accuracy by Dataset:")
    dataset_accuracy = metrics_df.groupby('dataset')['accuracy'].mean().sort_values(ascending=False)
    print(dataset_accuracy)

if __name__ == "__main__":
    main()