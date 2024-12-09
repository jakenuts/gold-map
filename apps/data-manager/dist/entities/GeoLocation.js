var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DataSource } from './DataSource.js';
let GeoLocation = class GeoLocation {
    id;
    name;
    category; // e.g., 'mineral_deposit', 'historical_site'
    subcategory; // e.g., 'Producer', 'Occurrence', 'Past Producer'
    location;
    properties;
    dataSource;
    dataSourceId;
    sourceId;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], GeoLocation.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], GeoLocation.prototype, "name", void 0);
__decorate([
    Column({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], GeoLocation.prototype, "category", void 0);
__decorate([
    Column({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], GeoLocation.prototype, "subcategory", void 0);
__decorate([
    Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 }),
    __metadata("design:type", Object)
], GeoLocation.prototype, "location", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], GeoLocation.prototype, "properties", void 0);
__decorate([
    ManyToOne(() => DataSource, (source) => source.locations),
    JoinColumn({ name: 'dataSourceId' }),
    __metadata("design:type", DataSource)
], GeoLocation.prototype, "dataSource", void 0);
__decorate([
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], GeoLocation.prototype, "dataSourceId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], GeoLocation.prototype, "sourceId", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], GeoLocation.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], GeoLocation.prototype, "updatedAt", void 0);
GeoLocation = __decorate([
    Entity('geo_locations')
], GeoLocation);
export { GeoLocation };
//# sourceMappingURL=GeoLocation.js.map