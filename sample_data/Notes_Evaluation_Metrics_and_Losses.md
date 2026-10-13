# Machine Learning Evaluation & Loss Functions

## Classification Loss Functions
Binary Cross-Entropy (Log Loss) measures performance where output probabilities range between 0 and 1.
For multi-class classification problems with C mutually exclusive classes, Categorical Cross-Entropy is used together with a Softmax output layer.

## Key Evaluation Metrics
- **Accuracy**: Proportion of total correct predictions. Deceptive when handling severely imbalanced datasets.
- **Precision**: True Positives / (True Positives + False Positives). Critical when the cost of False Positives is severe (e.g. spam detection).
- **Recall (Sensitivity)**: True Positives / (True Positives + False Negatives). Essential in medical diagnostics where missing a positive case is catastrophic.
- **F1 Score**: Harmonic mean of Precision and Recall: 2 * (Precision * Recall) / (Precision + Recall).

## Learning Rate Schedules
- **Cosine Annealing**: Decays the learning rate following a cosine curve down to a minimum threshold.
- **Warmup Phase**: Linearly increases learning rate for the initial 5-10% of training steps to stabilize optimization.
