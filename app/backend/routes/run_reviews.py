from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.backend.database import get_db
from app.backend.repositories.flow_run_repository import FlowRunRepository
from app.backend.repositories.run_review_repository import RunReviewRepository
from app.backend.models.schemas import RunReviewUpsertRequest, RunReviewResponse, ErrorResponse

router = APIRouter(prefix="/run-reviews", tags=["run-reviews"])


@router.get("/{run_id}", response_model=RunReviewResponse | None, responses={500: {"model": ErrorResponse}})
async def get_run_review(run_id: int, db: Session = Depends(get_db)):
    """Get the operator review for one flow run."""
    try:
        run = FlowRunRepository(db).get_flow_run_by_id(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Flow run not found")
        review = RunReviewRepository(db).get_by_run_id(run_id)
        return RunReviewResponse.from_orm(review) if review else None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve run review: {str(e)}")


@router.put("/{run_id}", response_model=RunReviewResponse, responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def upsert_run_review(run_id: int, request: RunReviewUpsertRequest, db: Session = Depends(get_db)):
    """Create or update the operator review for one flow run."""
    try:
        run = FlowRunRepository(db).get_flow_run_by_id(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Flow run not found")
        review = RunReviewRepository(db).upsert_review(run_id=run_id, **request.model_dump())
        return RunReviewResponse.from_orm(review)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save run review: {str(e)}")


@router.delete("/{run_id}", responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def delete_run_review(run_id: int, db: Session = Depends(get_db)):
    """Delete the operator review for one flow run."""
    try:
        if not RunReviewRepository(db).delete_review(run_id):
            raise HTTPException(status_code=404, detail="Run review not found")
        return {"message": "Run review deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete run review: {str(e)}")
