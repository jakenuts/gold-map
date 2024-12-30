import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { GeoLocation } from './GeoLocation.js';

@Entity('data_sources')
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url!: string;

  @Column({ type: 'jsonb', nullable: true })
  config!: Record<string, any>;

  @OneToMany(() => GeoLocation, (location: GeoLocation) => location.dataSource)
  locations!: GeoLocation[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
