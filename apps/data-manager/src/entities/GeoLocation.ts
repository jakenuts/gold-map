import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('geo_locations')
export class GeoLocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  locationType!: string; // 'mineral_deposit', 'historical_site', etc.

  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  location!: any;

  @Column({ type: 'jsonb', nullable: true })
  properties!: Record<string, any>;

  @Column({ type: 'varchar', length: 100 })
  source!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
