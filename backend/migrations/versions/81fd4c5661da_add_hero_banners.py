"""Add hero_banners table

Revision ID: 81fd4c5661da_add_hero_banners
Revises: 81fd4c5661da
Create Date: 2026-07-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '81fd4c5661da_add_hero_banners'
down_revision = '81fd4c5661da'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('hero_banners',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('subtitle', sa.String(length=500), nullable=True),
        sa.Column('badge', sa.String(length=120), nullable=True),

        sa.Column('desktop_image', sa.String(length=500), nullable=True),
        sa.Column('mobile_image', sa.String(length=500), nullable=True),

        sa.Column('primary_text', sa.String(length=120), nullable=True),
        sa.Column('primary_url', sa.String(length=500), nullable=True),
        sa.Column('secondary_text', sa.String(length=120), nullable=True),
        sa.Column('secondary_url', sa.String(length=500), nullable=True),

        sa.Column('layout', sa.String(length=20), nullable=False, server_default='left'),
        sa.Column('overlay_opacity', sa.Float(), nullable=False, server_default='0.3'),

        sa.Column('animation', sa.String(length=20), nullable=False, server_default='fade'),

        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),

        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),

        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),

        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('hero_banners')

