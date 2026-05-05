from typing import Optional
from sqlalchemy.orm import Session
from app.backend.database.models import VolcanoRunReview


class RunReviewRepository:
    """Repository for Volcano Fund run review CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_run_id(self, run_id: int) -> Optional[VolcanoRunReview]:
        return self.db.query(VolcanoRunReview).filter(VolcanoRunReview.run_id == run_id).first()

    def upsert_review(self, run_id: int, review_status: str = "draft", reviewer: str = None,
                      notes: str = None, decision: str = None, extra_metadata: dict = None) -> VolcanoRunReview:
        review = self.get_by_run_id(run_id)
        if not review:
            review = VolcanoRunReview(run_id=run_id)
            self.db.add(review)

        review.review_status = review_status
        review.reviewer = reviewer
        review.notes = notes
        review.decision = decision
        review.extra_metadata = extra_metadata
        self.db.commit()
        self.db.refresh(review)
        return review

    def delete_review(self, run_id: int) -> bool:
        review = self.get_by_run_id(run_id)
        if not review:
            return False
        self.db.delete(review)
        self.db.commit()
        return True
