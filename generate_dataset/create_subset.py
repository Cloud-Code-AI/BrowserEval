import random
from datasets import load_dataset, Dataset
import json
from huggingface_hub import HfApi

def create_dataset_subset(dataset_name: str, subset_name: str, num_samples: int = 250, seed: int = 42, repo_name: str = "smalleval/mmlu"):
    """
    Create a subset of a HuggingFace LightEval dataset and save it to the smalleval repository.
    
    Args:
        dataset_name (str): Name of the source dataset (e.g., 'lighteval/mmlu')
        subset_name (str): Name of the subset to create
        num_samples (int): Number of samples to include in the subset
        seed (int): Random seed for reproducibility
    """
    # Set random seed for reproducibility
    random.seed(seed)
    
    # Load the original dataset
    try:
        dataset = load_dataset(dataset_name, subset_name)
        # Most datasets have a 'test' split, but fallback to 'train' if not available
        split = 'test' if 'test' in dataset else 'train'
        full_dataset = dataset[split]
    except Exception as e:
        print(f"Error loading dataset {dataset_name}: {str(e)}")
        return

    # Ensure we don't try to sample more than what's available
    num_samples = min(num_samples, len(full_dataset))
    
    # Randomly sample indices
    selected_indices = random.sample(range(len(full_dataset)), num_samples)
    
    # Create the subset
    subset = full_dataset.select(selected_indices)
    
    # Convert to list of dictionaries for JSONL format
    subset_data = [example for example in subset]
    
    # Create filename based on dataset and subset names
    filename = f"{dataset_name.split('/')[-1]}_{subset_name}.jsonl"
    
    try:
        # Write to JSONL file
        with open('datasets/' + filename, 'w', encoding='utf-8') as f:
            for item in subset_data:
                f.write(json.dumps(item) + '\n')
        
        # Upload the JSONL file to the hub using the Hugging Face Hub API
        api = HfApi()
        api.upload_file(
            path_or_fileobj='datasets/' + filename,
            path_in_repo=filename,
            repo_id=repo_name,
            commit_message=f"Add {filename} with {num_samples} samples"
        )
        print(f"Successfully pushed {filename} to: {repo_name}")
    except Exception as e:
        print(f"Error pushing to Hub: {str(e)}")

if __name__ == "__main__":
    # Example usage - you can create multiple subsets
    datasets_to_create = [
        ("lighteval/truthfulqa_helm", None),
        ("lighteval/super_glue", "boolq"),
        ("lighteval/super_glue", "cb"),
        ("lighteval/super_glue", "copa"),
        ("lighteval/super_glue", "rte"),
        ("lighteval/super_glue", "wic"),
        ("lighteval/super_glue", "wsc"),
        ("lighteval/hellaswag_thai", None),
        ("lighteval/MathQA-TR", None),
        ("lighteval/boolq_helm", None),
        ("lighteval/numeracy", None),
        ("lighteval/mmlu", "high_school_mathematics"),
        ("lighteval/mmlu", "high_school_physics"),
        ("lighteval/mmlu", "high_school_biology"),
        ("lighteval/mmlu", "high_school_chemistry"),
        ("lighteval/mmlu", "high_school_computer_science"),
        ("lighteval/mmlu", "high_school_psychology"),
        ("lighteval/mmlu", "high_school_us_history"),
        ("lighteval/mmlu", "high_school_world_history"),
        ("google/IFEval", None)
    ]
    
    for dataset_name, subset_name in datasets_to_create:
        create_dataset_subset(
            dataset_name=dataset_name,
            subset_name=subset_name,
            num_samples=2500,
            seed=42,
            repo_name="smalleval/mmlu-nano"
        )