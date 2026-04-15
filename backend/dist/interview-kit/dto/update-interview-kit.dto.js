"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateScorecardDto = exports.UpdateInterviewKitDto = exports.ScorecardItemDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class ScorecardItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { competency: { required: true, type: () => String }, weight: { required: true, type: () => Number }, score: { required: true, type: () => Number }, notes: { required: true, type: () => String } };
    }
}
exports.ScorecardItemDto = ScorecardItemDto;
class UpdateInterviewKitDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { scorecard: { required: false, type: () => [require("./update-interview-kit.dto").ScorecardItemDto] } };
    }
}
exports.UpdateInterviewKitDto = UpdateInterviewKitDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ScorecardItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ScorecardItemDto),
    __metadata("design:type", Array)
], UpdateInterviewKitDto.prototype, "scorecard", void 0);
class UpdateScorecardDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { scorecard: { required: true, type: () => [require("./update-interview-kit.dto").ScorecardItemDto] } };
    }
}
exports.UpdateScorecardDto = UpdateScorecardDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ScorecardItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ScorecardItemDto),
    __metadata("design:type", Array)
], UpdateScorecardDto.prototype, "scorecard", void 0);
//# sourceMappingURL=update-interview-kit.dto.js.map