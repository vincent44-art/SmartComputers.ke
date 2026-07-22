"""Add product_variants table and variant columns to cart_items

Revision ID: 81fd4c5661da_add_product_variants
Revises: 81fd4c5661da_add_hero_banners
Create Date: 2026-07-17 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '81fd4c5661da_add_product_variants'
down_revision = '81fd4c5661da_add_hero_banners'
branch_labels = None
depends_on = None


def upgrade():
    # Create product_variants table
    op.create_table('product_variants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('sku', sa.String(length=60), nullable=False),
        sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('stock', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('attributes', sa.JSON(), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),

        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_id', 'sku', name='uq_variant_product_sku')
    )
    with op.batch_alter_table('product_variants', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_product_variants_product_id'), ['product_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_product_variants_sku'), ['sku'], unique=True)

    # Add variant columns to cart_items
    with op.batch_alter_table('cart_items', schema=None) as batch_op:
        batch_op.add_column(sa.Column('variant_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('variant_data', sa.JSON(), nullable=True))
        batch_op.create_foreign_key(
            'fk_cart_items_variant_id',
            'product_variants',
            ['variant_id'],
            ['id']
        )


def downgrade():
    # Remove variant columns from cart_items
    with op.batch_alter_table('cart_items', schema=None) as batch_op:
        batch_op.drop_constraint('fk_cart_items_variant_id', type_='foreignkey')
        batch_op.drop_column('variant_data')
        batch_op.drop_column('variant_id')

    # Drop product_variants table
    with op.batch_alter_table('product_variants', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_product_variants_sku'))
        batch_op.drop_index(batch_op.f('ix_product_variants_product_id'))

    op.drop_table('product_variants')

