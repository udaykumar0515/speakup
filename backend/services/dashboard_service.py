from services.interview_service import INTERVIEW_RESULTS
from services.gd_service import GD_RESULTS
from services.aptitude_service import APTITUDE_RESULTS
from services.resume_service import RESUME_RESULTS

def get_user_stats(userId: int):
    # Filter by userId
    interviews = [r for r in INTERVIEW_RESULTS if r.userId == userId]
    gds = [r for r in GD_RESULTS if r.userId == userId]
    aptitudes = [r for r in APTITUDE_RESULTS if r.userId == userId]
    resumes = [r for r in RESUME_RESULTS if r.userId == userId]

    # Calculate Avgs
    avg_int = 0
    if interviews:
        total = sum([(i.communicationScore + i.confidenceScore + i.relevanceScore)/3 for i in interviews])
        avg_int = int(total / len(interviews))
        
    avg_gd = 0
    if gds:
        avg_gd = int(sum([g.score for g in gds]) / len(gds))
        
    avg_apt = 0
    if aptitudes:
        avg_apt = int(sum([a.score for a in aptitudes]) / len(aptitudes))

    # Recent Activity
    activity = []
    for x in interviews:
        sc = int((x.communicationScore + x.confidenceScore + x.relevanceScore)/3)
        activity.append({"type": "interview", "date": x.createdAt, "score": sc, "description": "Mock Interview"})
        
    for x in gds:
        activity.append({"type": "gd", "date": x.createdAt, "score": x.score, "description": f"GD: {x.topic}"})
        
    for x in aptitudes:
        activity.append({"type": "aptitude", "date": x.createdAt, "score": x.score, "description": f"Aptitude: {x.topic}"})
        
    for x in resumes:
        activity.append({"type": "resume", "date": x.createdAt, "score": x.atsScore, "description": "Resume Analysis"})

    # Sort
    activity.sort(key=lambda x: x['date'], reverse=True)
    
    # Format Dates
    final_activity = []
    for item in activity[:5]:
        item['date'] = item['date'].isoformat()
        final_activity.append(item)

    return {
        "user": {"name": "User", "email": "user@example.com"},
        "stats": {
            "totalInterviews": len(interviews),
            "totalGdSessions": len(gds),
            "totalAptitudeTests": len(aptitudes),
            "totalResumesAnalyzed": len(resumes),
            "averageInterviewScore": avg_int,
            "averageGdScore": avg_gd,
            "averageAptitudeScore": avg_apt
        },
        "recentActivity": final_activity
    }
