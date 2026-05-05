from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.backend.database import get_db
from app.backend.repositories.research_brief_repository import ResearchBriefRepository
from app.backend.repositories.flow_repository import FlowRepository
from app.backend.repositories.flow_run_repository import FlowRunRepository
from app.backend.repositories.run_review_repository import RunReviewRepository
from app.backend.models.schemas import (
    ResearchBriefCreateRequest,
    ResearchBriefUpdateRequest,
    ResearchBriefResponse,
    ResearchBriefHistoryResponse,
    ErrorResponse,
)

router = APIRouter(prefix="/research-briefs", tags=["research-briefs"])


@router.post("/", response_model=ResearchBriefResponse, responses={500: {"model": ErrorResponse}})
async def create_research_brief(request: ResearchBriefCreateRequest, db: Session = Depends(get_db)):
    """Create a persistent Volcano Fund research brief draft."""
    try:
        repo = ResearchBriefRepository(db)
        brief = repo.create_brief(
            title=request.title,
            owner=request.owner,
            tickers=request.tickers,
            brief=request.brief,
            template_id=request.template_id,
            status=request.status,
            flow_id=request.flow_id,
            extra_metadata=request.extra_metadata,
        )
        return ResearchBriefResponse.from_orm(brief)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create research brief: {str(e)}")


@router.get("/", response_model=List[ResearchBriefResponse], responses={500: {"model": ErrorResponse}})
async def get_research_briefs(limit: int = 20, db: Session = Depends(get_db)):
    """List recent Volcano Fund research briefs."""
    try:
        repo = ResearchBriefRepository(db)
        return [ResearchBriefResponse.from_orm(brief) for brief in repo.get_all_briefs(limit=limit)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve research briefs: {str(e)}")


@router.get("/history/", response_model=List[ResearchBriefHistoryResponse], responses={500: {"model": ErrorResponse}})
async def get_research_brief_history(limit: int = 20, db: Session = Depends(get_db)):
    """List recent briefs enriched with linked flow and latest run status."""
    try:
        brief_repo = ResearchBriefRepository(db)
        flow_repo = FlowRepository(db)
        run_repo = FlowRunRepository(db)
        review_repo = RunReviewRepository(db)
        history = []

        for brief in brief_repo.get_all_briefs(limit=limit):
            payload = ResearchBriefResponse.from_orm(brief).model_dump()
            payload.update({
                "flow_name": None,
                "run_count": 0,
                "latest_run_id": None,
                "latest_run_status": None,
                "latest_run_number": None,
                "latest_run_created_at": None,
                "review_status": None,
                "review_decision": None,
                "review_notes": None,
                "reviewer": None,
            })

            if brief.flow_id:
                flow = flow_repo.get_flow_by_id(brief.flow_id)
                latest_run = run_repo.get_latest_flow_run(brief.flow_id)
                payload["flow_name"] = flow.name if flow else None
                payload["run_count"] = run_repo.get_flow_run_count(brief.flow_id)
                if latest_run:
                    payload["latest_run_id"] = latest_run.id
                    payload["latest_run_status"] = latest_run.status
                    payload["latest_run_number"] = latest_run.run_number
                    payload["latest_run_created_at"] = latest_run.created_at
                    review = review_repo.get_by_run_id(latest_run.id)
                    if review:
                        payload["review_status"] = review.review_status
                        payload["review_decision"] = review.decision
                        payload["review_notes"] = review.notes
                        payload["reviewer"] = review.reviewer

            history.append(ResearchBriefHistoryResponse(**payload))

        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve research brief history: {str(e)}")


@router.get("/{brief_id}", response_model=ResearchBriefResponse, responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def get_research_brief(brief_id: int, db: Session = Depends(get_db)):
    """Get one Volcano Fund research brief."""
    try:
        repo = ResearchBriefRepository(db)
        brief = repo.get_brief_by_id(brief_id)
        if not brief:
            raise HTTPException(status_code=404, detail="Research brief not found")
        return ResearchBriefResponse.from_orm(brief)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve research brief: {str(e)}")


@router.put("/{brief_id}", response_model=ResearchBriefResponse, responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def update_research_brief(brief_id: int, request: ResearchBriefUpdateRequest, db: Session = Depends(get_db)):
    """Update a persistent Volcano Fund research brief draft."""
    try:
        repo = ResearchBriefRepository(db)
        brief = repo.update_brief(brief_id, **request.model_dump(exclude_unset=True))
        if not brief:
            raise HTTPException(status_code=404, detail="Research brief not found")
        return ResearchBriefResponse.from_orm(brief)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update research brief: {str(e)}")


@router.delete("/{brief_id}", responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def delete_research_brief(brief_id: int, db: Session = Depends(get_db)):
    """Delete a Volcano Fund research brief."""
    try:
        repo = ResearchBriefRepository(db)
        if not repo.delete_brief(brief_id):
            raise HTTPException(status_code=404, detail="Research brief not found")
        return {"message": "Research brief deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete research brief: {str(e)}")
