from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId
from app.models.user import User
from app.models.event import Event
from app.models.score import Score
from app.models.team import Team
from app.models.enums import UserRole
from app.schemas.score import ScoreCreate, ScoreResponse
from app.core.dependencies import get_current_active_user
from app.utils.audit import log_activity

router = APIRouter()

@router.get("/events/{event_id}/judges", response_model=List[Dict[str, Any]])
async def list_event_judges(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists all judges assigned to this event.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    judges = await User.find({"_id": {"$in": event.judges}}).to_list()
    return [{"id": str(j.id), "full_name": j.full_name, "email": j.email} for j in judges]

@router.post("/events/{event_id}/judges", status_code=status.HTTP_200_OK)
async def assign_judge(
    event_id: PydanticObjectId,
    judge_user_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Assigns a judge to an event. Restricted to event managers.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not is_manager:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    judge = await User.get(judge_user_id)
    if not judge or judge.role != UserRole.JUDGE:
        raise HTTPException(status_code=400, detail="User is not a registered judge")
        
    if judge_user_id not in event.judges:
        event.judges.append(judge_user_id)
        await event.save()
        
    await log_activity(
        actor_id=current_user.id,
        action="assign_judge",
        target_model="events",
        target_id=event_id,
        changes_payload={"judge_id": str(judge_user_id)}
    )
    return {"message": "Judge assigned successfully"}

@router.delete("/events/{event_id}/judges/{judge_user_id}", status_code=status.HTTP_200_OK)
async def remove_judge(
    event_id: PydanticObjectId,
    judge_user_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Removes an assigned judge from an event. Restricted to managers.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if not is_manager:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    if judge_user_id in event.judges:
        event.judges.remove(judge_user_id)
        await event.save()
        
    await log_activity(
        actor_id=current_user.id,
        action="remove_judge",
        target_model="events",
        target_id=event_id,
        changes_payload={"judge_id": str(judge_user_id)}
    )
    return {"message": "Judge removed successfully"}

@router.post("/events/{event_id}/scores", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
async def submit_team_score(
    event_id: PydanticObjectId,
    payload: ScoreCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Submits score sheet evaluations for a team. Must be an assigned Judge.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # verify if judge is assigned to this event
    if current_user.role != UserRole.SUPER_ADMIN and current_user.id not in event.judges:
        raise HTTPException(status_code=403, detail="You are not assigned as a judge for this event")
        
    # verify team exists in event
    team = await Team.find_one(Team.id == payload.team_id, Team.event_id == event_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found in this event")
        
    # Calculate total score from criteria_scores (average them, or sum them)
    if not payload.criteria_scores:
        raise HTTPException(status_code=400, detail="Criteria scores are required")
        
    total = sum(payload.criteria_scores.values())
    
    # check if already scored, if so, update it
    score_doc = await Score.find_one(
        Score.event_id == event_id,
        Score.team_id == payload.team_id,
        Score.judge_user_id == current_user.id
    )
    
    if score_doc:
        score_doc.criteria_scores = payload.criteria_scores
        score_doc.total_score = total
        score_doc.comments = payload.comments
        score_doc.updated_at = datetime.now(timezone.utc)
        await score_doc.save()
    else:
        score_doc = Score(
            event_id=event_id,
            team_id=payload.team_id,
            judge_user_id=current_user.id,
            criteria_scores=payload.criteria_scores,
            total_score=total,
            comments=payload.comments
        )
        await score_doc.insert()
        
    await log_activity(
        actor_id=current_user.id,
        action="submit_score",
        target_model="events",
        target_id=event_id,
        changes_payload={"team_name": team.team_name, "total_score": total}
    )
    return score_doc

@router.get("/events/{event_id}/scores", response_model=List[ScoreResponse])
async def list_event_scores(
    event_id: PydanticObjectId,
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists all evaluation sheets logged. Managers see all; Judges see their own.
    """
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_manager = (
        current_user.role in [UserRole.SUPER_ADMIN]
        or (current_user.society_id == event.society_id and current_user.role in [
            UserRole.SOCIETY_PRESIDENT, UserRole.SOCIETY_ADMIN, UserRole.EVENT_HOST
        ])
    )
    if is_manager:
        return await Score.find(Score.event_id == event_id).to_list()
        
    if current_user.role == UserRole.JUDGE:
        return await Score.find(Score.event_id == event_id, Score.judge_user_id == current_user.id).to_list()
        
    raise HTTPException(status_code=403, detail="Access denied")

@router.get("/events/{event_id}/leaderboard")
async def get_live_leaderboard(event_id: PydanticObjectId):
    """
    Calculates live aggregate rankings for teams in this event.
    Aggregates judge scores by computing the average total score.
    """
    teams = await Team.find(Team.event_id == event_id).to_list()
    leaderboard = []
    
    for team in teams:
        scores = await Score.find(Score.team_id == team.id).to_list()
        if not scores:
            avg_score = 0.0
            judge_count = 0
        else:
            avg_score = sum(s.total_score for s in scores) / len(scores)
            judge_count = len(scores)
            
        leaderboard.append({
            "team_id": str(team.id),
            "team_name": team.team_name,
            "average_score": round(avg_score, 2),
            "judge_count": judge_count
        })
        
    # Sort leaderboard by average_score desc
    leaderboard.sort(key=lambda x: x["average_score"], reverse=True)
    
    # Inject rank positions
    for idx, item in enumerate(leaderboard):
        item["rank"] = idx + 1
        
    return leaderboard
