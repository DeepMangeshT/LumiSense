# LumiSense Machine Learning Methodology

This document explains the algorithms, feature engineering strategies, target variable formulation, and validation practices implemented in LumiSense.

---

## 1. Academic & Technical Context

In low-cost IoT monitoring without invasive current clamps or dedicated energy meters, electrical power consumption in kilowatt-hours (kWh) **cannot be directly measured**. 

Attempting to claim electrical measurement from ambient light and PIR sensors would be academically invalid. LumiSense solves this by modeling:
1. **Estimated Lighting Demand (%)**: The anticipated artificial illumination required based on room occupancy and natural ambient daylight.
2. **Behavioral Inefficiencies & Anomalies**: Outlier environmental patterns detected via unsupervised learning.

---

## 2. Machine Learning Algorithms

### 2.1. Random Forest Regressor (Estimated Demand)
* **Type:** Supervised ensemble of decision trees.
* **Why Selected:** Highly explainable, resistant to overfitting on sensor noise, non-linear feature interaction modeling, and well-suited for academic demonstrations.
* **Hyperparameters:**
  * Number of Trees (`n_estimators`): 80
  * Max Depth: 8
  * Min Samples Split: 4
  * Split Criterion: Mean Squared Error (MSE)

### 2.2. Isolation Forest (Anomaly Detection)
* **Type:** Unsupervised anomaly detection based on random decision tree partitioning.
* **Why Selected:** Anomalies require few random partitions to isolate from normal data points. Contamination factor is configured to `0.04`.
* **Detected Patterns:**
  * Severe artificial lighting (relative ADC > 600) when room has been unoccupied (PIR = 0) for extended intervals.
  * Unusual off-hours room activity.
  * Sudden sensor drift or hardware disconnect spikes.

---

## 3. Feature Engineering Pipeline

All features are engineered sequentially to guarantee **zero data leakage**:

| Feature Name | Type | Description |
| :--- | :--- | :--- |
| `hour` | Integer (0-23) | Hour of the day |
| `minute` | Integer (0-59) | Minute of the hour |
| `day_of_week` | Integer (0-6) | Day index (Monday = 0) |
| `is_weekend` | Binary (0/1) | Weekend occupancy indicator |
| `light_smoothed` | Float | Moving average filtered LDR light level |
| `motion` | Binary (0/1) | Current PIR occupancy state |
| `rolling_light_mean` | Float | Average light over the past 5 samples |
| `rolling_motion_sum` | Float | Sum of motion events over the past 5 samples |
| `light_lag_1` | Float | Light value at sample $t-1$ |
| `motion_lag_1` | Binary (0/1) | Motion state at sample $t-1$ |

Missing future sensors (`temperature`, `humidity`) are handled gracefully without breaking the feature pipeline.

---

## 4. Target Variable Formulation

The continuous target variable **Lighting Demand ($Y$)** is defined by environmental physical adequacy:

$$Y = \begin{cases} 
\max\left(10, \left(1.0 - \frac{\text{light}}{800}\right) \times 85 + 10\right) & \text{if } \text{motion} = 1 \\
\text{night\_standby} & \text{if } \text{motion} = 0 \text{ (22:00 - 06:00)} \\
0 & \text{if } \text{motion} = 0 \text{ (Daytime)}
\end{cases}$$

This ensures that when an occupant enters a dark room, lighting demand approaches 90-100%, whereas in a sunlit room, demand drops to 15-25%. When vacant, demand is 0%.

---

## 5. Model Evaluation Metrics

Models are evaluated on an 80/20 train/test split without shuffling to respect temporal dependencies:
* **MAE (Mean Absolute Error):** Measures average absolute deviation in demand percentage points.
* **RMSE (Root Mean Squared Error):** Penalizes larger predictive errors.
* **$R^2$ Score:** Quantifies the proportion of target variance explained by environmental features.

---

## 6. Data Readiness Verification Thresholds

To maintain technical honesty, LumiSense enforces configurable readiness states:
* **$< 100$ records:** `INSUFFICIENT_DATA`. Model training is disabled; clear warning displayed.
* **$100 - 500$ records:** `EARLY_EXPERIMENTATION`. Training permitted for preliminary demonstration with advisory note.
* **$500+$ records:** `READY`. Optimal sample size for reliable model convergence.
