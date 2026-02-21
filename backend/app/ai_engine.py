import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Try to import scikit-learn; fall back to rule-based if unavailable
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    from sklearn.ensemble import IsolationForest
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    logger.info("scikit-learn not available, using rule-based scoring only")

_model = None
_is_fitted = False


def extract_features(logs: list[dict]) -> list[list[float]]:
    """Extract features from a batch of behavior logs."""
    features = []
    for log in logs:
        features.append([
            1.0 if log.get("permission_requested", "none") != "none" else 0.0,
            float(log.get("network_activity_level", 0.0)),
            1.0 if log.get("background_process_flag", False) else 0.0,
            1.0 if log.get("anomaly_flag", False) else 0.0,
        ])
    return features


def compute_baseline(logs: list[dict]) -> Dict[str, float]:
    """Compute an average baseline from historical logs for a user."""
    if not logs:
        return {"avg_permission_usage": 0.0, "avg_network_activity": 0.0, "avg_background_process_rate": 0.0}

    n = max(len(logs), 1)
    perm_count = sum(1 for l in logs if l.get("permission_requested", "none") != "none")
    net_sum = sum(float(l.get("network_activity_level", 0.0)) for l in logs)
    bg_count = sum(1 for l in logs if l.get("background_process_flag", False))

    return {
        "avg_permission_usage": perm_count / n,
        "avg_network_activity": net_sum / n,
        "avg_background_process_rate": bg_count / n
    }


def calculate_risk_score_ml(logs: list[dict], baseline: Optional[Dict[str, float]] = None) -> float:
    """Use Isolation Forest if available, adjusting via baseline deviation. Returns 0-100."""
    global _model, _is_fitted

    if not HAS_SKLEARN or not HAS_NUMPY or len(logs) < 5:
        return calculate_risk_score_rules(logs, baseline)

    import numpy as np
    features = np.array(extract_features(logs))
    if features.shape[0] == 0:
        return 0.0

    try:
        if _model is None:
            _model = IsolationForest(
                n_estimators=100, contamination=0.15, random_state=42, n_jobs=-1
            )

        if not _is_fitted:
            _model.fit(features)
            _is_fitted = True

        scores = _model.score_samples(features)
        avg_score = float(np.mean(scores))
        
        # Base risk from Isolation Forest
        risk = max(0, min(100, (0.5 - avg_score) * 100))
        
        # Adjust based on baseline deviation if available
        if baseline:
            # Simple Z-score like heuristic for demo purposes
            recent_perm = sum(1 for l in logs if l.get("permission_requested", "none") != "none") / len(logs)
            recent_net = sum(float(l.get("network_activity_level", 0.0)) for l in logs) / len(logs)
            
            perm_diff = max(0, recent_perm - baseline.get("avg_permission_usage", 0.0))
            net_diff = max(0, recent_net - baseline.get("avg_network_activity", 0.0))
            
            # Add up to 20 points for deviation
            deviation_penalty = (perm_diff * 10) + (net_diff / 10)
            risk = min(100, risk + deviation_penalty)
            
        return round(risk, 1)
    except Exception as e:
        logger.warning(f"ML scoring failed, falling back to rules: {e}")
        return calculate_risk_score_rules(logs, baseline)


def calculate_risk_score_rules(logs: list[dict], baseline: Optional[Dict[str, float]] = None) -> float:
    """Rule-based risk scoring with optional baseline deviation penalty. Returns 0-100."""
    if not logs:
        return 0.0

    n = len(logs)

    # Permission anomaly
    perm_count = sum(1 for l in logs if l.get("permission_requested", "none") != "none")
    perm_score = min(100, (perm_count / max(n, 1)) * 100)

    # Network anomaly
    net_levels = [float(l.get("network_activity_level", 0.0)) for l in logs]
    net_avg = sum(net_levels) / len(net_levels) if net_levels else 0.0
    net_score = min(100, net_avg)

    # Background process anomaly
    bg_count = sum(1 for l in logs if l.get("background_process_flag", False))
    bg_score = min(100, (bg_count / max(n, 1)) * 100)

    # Suspicious domain / anomaly flag
    anomaly_count = sum(1 for l in logs if l.get("anomaly_flag", False))
    domain_score = min(100, (anomaly_count / max(n, 1)) * 100)

    # Weighted formula
    risk = (
        perm_score * 0.3 +
        net_score * 0.3 +
        bg_score * 0.2 +
        domain_score * 0.2
    )
    
    # Apply baseline penalty
    if baseline:
        recent_perm = perm_count / max(n, 1)
        recent_net = net_avg
        perm_diff = max(0, recent_perm - baseline.get("avg_permission_usage", 0.0))
        net_diff = max(0, recent_net - baseline.get("avg_network_activity", 0.0))
        deviation_penalty = (perm_diff * 10) + (net_diff / 5)
        risk = min(100, risk + deviation_penalty)

    return round(max(0, min(100, risk)), 1)


def get_risk_level(score: float) -> str:
    if score <= 40:
        return "low"
    elif score <= 70:
        return "medium"
    else:
        return "high"


def generate_explanation(logs: list[dict], risk_score: float) -> str:
    """Generate a natural language explanation for why the risk score is high."""
    if not logs:
        return "No recent activity logs available to explain."
        
    explanations = []
    
    n = len(logs)
    perm_count = sum(1 for l in logs if l.get("permission_requested", "none") != "none")
    net_avg = sum(float(l.get("network_activity_level", 0.0)) for l in logs) / n
    bg_count = sum(1 for l in logs if l.get("background_process_flag", False))
    anomaly_count = sum(1 for l in logs if l.get("anomaly_flag", False))
    
    if anomaly_count > 0:
        explanations.append(f"Detected {anomaly_count} known suspicious activities or domains.")
    
    if perm_count > (n * 0.5):
        explanations.append("Unusually high rate of sensitive permission requests.")
        
    if net_avg > 60:
        explanations.append(f"Heavy network utilization detected (avg {net_avg:.1f}%).")
        
    if bg_count > (n * 0.4):
        explanations.append("Excessive background processes running stealthily.")
        
    if not explanations:
        if risk_score > 70:
            return "Risk increased due to aggregate subtle deviations from baseline behavior."
        return "Activity appears normal."
        
    return " ".join(explanations)

def generate_recommendation(severity: str) -> str:
    """Generate actionable advice based on severity."""
    if severity == "critical":
        return "Immediate action required: Revoke network access for the compromised app, change passwords, and consider factory resetting the device if anomalous behavior persists."
    elif severity == "high":
        return "Review the app's requested permissions immediately and consider uninstalling it. Run a malware scan."
    else:
        return "Monitor the app's activity. Ensure it only has access to necessary permissions."


def calculate_risk(logs: list[dict], baseline: Optional[Dict[str, float]] = None) -> dict:
    """Main entry point: calculate risk score, level, explanation, and recommendation."""
    try:
        score = calculate_risk_score_ml(logs, baseline)
    except Exception:
        score = calculate_risk_score_rules(logs, baseline)

    level = get_risk_level(score)
    severity = "critical" if score >= 85 else "high" if score > 70 else level
    
    explanation = generate_explanation(logs, score)
    recommendation = generate_recommendation(severity)
    
    return {
        "score": score, 
        "level": level, 
        "explanation": explanation,
        "recommendation": recommendation,
        "severity": severity
    }
