from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.backend.database import get_db
from app.backend.repositories.research_brief_repository import ResearchBriefRepository
from app.backend.models.schemas import (
    ResearchBriefCreateRequest,
    ResearchBriefUpdateRequest,
    ResearchBriefResponse,
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
