from typing import List, Optional
from sqlalchemy.orm import Session
from app.backend.database.models import VolcanoResearchBrief


class ResearchBriefRepository:
    """Repository for Volcano Fund research brief CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create_brief(self, title: str, owner: str, tickers: str, brief: str,
                     template_id: str = None, status: str = "draft", flow_id: int = None,
                     extra_metadata: dict = None) -> VolcanoResearchBrief:
        research_brief = VolcanoResearchBrief(
            title=title,
            owner=owner,
            tickers=tickers,
            brief=brief,
            template_id=template_id,
            status=status,
            flow_id=flow_id,
            extra_metadata=extra_metadata,
        )
        self.db.add(research_brief)
        self.db.commit()
        self.db.refresh(research_brief)
        return research_brief

    def get_brief_by_id(self, brief_id: int) -> Optional[VolcanoResearchBrief]:
        return self.db.query(VolcanoResearchBrief).filter(VolcanoResearchBrief.id == brief_id).first()

    def get_all_briefs(self, limit: int = 20) -> List[VolcanoResearchBrief]:
        safe_limit = max(1, min(limit, 100))
        return (
            self.db.query(VolcanoResearchBrief)
            .order_by(VolcanoResearchBrief.updated_at.desc().nullslast(), VolcanoResearchBrief.created_at.desc())
            .limit(safe_limit)
            .all()
        )

    def update_brief(self, brief_id: int, **fields) -> Optional[VolcanoResearchBrief]:
        research_brief = self.get_brief_by_id(brief_id)
        if not research_brief:
            return None

        for key, value in fields.items():
            if value is not None:
                setattr(research_brief, key, value)

        self.db.commit()
        self.db.refresh(research_brief)
        return research_brief

    def delete_brief(self, brief_id: int) -> bool:
        research_brief = self.get_brief_by_id(brief_id)
        if not research_brief:
            return False
        self.db.delete(research_brief)
        self.db.commit()
        return True
