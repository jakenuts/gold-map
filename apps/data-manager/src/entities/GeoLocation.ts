import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DataSource } from './DataSource.js';

@Entity('geo_locations')
export class GeoLocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  category!: string; // e.g., 'mineral_deposit', 'historical_site'

  @Column({ type: 'varchar', length: 100 })
  subcategory!: string; // e.g., 'Producer', 'Occurrence', 'Past Producer'

  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  location!: any;

  @Column({ type: 'jsonb', nullable: true })
  properties!: Record<string, any>;

  @ManyToOne(() => DataSource, (source: DataSource) => source.locations)
  @JoinColumn({ name: 'dataSourceId' })
  dataSource!: DataSource;

  @Column({ type: 'uuid' })
  dataSourceId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
