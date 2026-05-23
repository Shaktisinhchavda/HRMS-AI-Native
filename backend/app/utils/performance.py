def calculate_performance_score(emp_id: int, leaves_taken: int, salary: float) -> tuple[float, float, float]:
    """
    Dynamically calculates a performance score based on leaves, working hours, and salary.
    Returns (score, working_hours, overworked_hours).
    """
    # Deterministically mock weekly working hours between 35 and 50 based on emp_id
    working_hours = 35.0 + (emp_id % 16)
    overworked_hours = max(0, working_hours - 40.0)
    
    # Base score
    score = 4.0
    
    # 1. Working hours impact (Reward for full hours, penalty for underworking)
    if working_hours < 40:
        score -= (40 - working_hours) * 0.1
    elif working_hours <= 45:
        score += (working_hours - 40) * 0.05
        
    # 2. Overworked penalty (Burnout decreases performance)
    if overworked_hours > 5:
        score -= (overworked_hours - 5) * 0.2
        
    # 3. Leaves impact (Reasonable leave is fine, excessive leave drops score)
    if leaves_taken > 10:
        score -= (leaves_taken - 10) * 0.1
        
    # 4. Salary expectation (Higher salary = higher expectation. Slight penalty if low hours)
    if salary > 80000 and working_hours < 40:
        score -= 0.2
        
    # Clamp between 1.0 and 5.0
    final_score = max(1.0, min(5.0, score))
    return round(final_score, 1), working_hours, overworked_hours
