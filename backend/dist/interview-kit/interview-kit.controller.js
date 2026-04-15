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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicKitController = exports.InterviewKitController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const interview_kit_service_1 = require("./interview-kit.service");
const create_interview_kit_dto_1 = require("./dto/create-interview-kit.dto");
const update_interview_kit_dto_1 = require("./dto/update-interview-kit.dto");
const query_interview_kit_dto_1 = require("./dto/query-interview-kit.dto");
let InterviewKitController = class InterviewKitController {
    constructor(kitService) {
        this.kitService = kitService;
    }
    generate(dto, req) {
        return this.kitService.generate(dto, req.user.id);
    }
    findAll(query, req) {
        return this.kitService.findAll(req.user.id, query);
    }
    findById(id, req) {
        return this.kitService.findById(id, req.user.id);
    }
    getStatus(id, req) {
        return this.kitService.getStatus(id, req.user.id);
    }
    updateKit(id, updates, req) {
        return this.kitService.updateKit(id, req.user.id, updates);
    }
    updateScorecard(id, dto, req) {
        return this.kitService.updateScorecard(id, req.user.id, dto);
    }
    regenerateSection(id, section, req) {
        return this.kitService.regenerateSection(id, req.user.id, section);
    }
    getShareToken(id, req) {
        return this.kitService.getShareToken(id, req.user.id);
    }
    exportPdf(id, req) {
        return this.kitService.exportPdf(id, req.user.id).then((url) => ({ url }));
    }
    exportDocx(id, req) {
        return this.kitService.exportDocx(id, req.user.id).then((url) => ({ url }));
    }
    duplicate(id, req) {
        return this.kitService.duplicate(id, req.user.id);
    }
    remove(id, req) {
        return this.kitService.remove(id, req.user.id);
    }
};
exports.InterviewKitController = InterviewKitController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, throttler_1.Throttle)({ generation: { ttl: 3_600_000, limit: 20 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a new interview kit via AI' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_interview_kit_dto_1.CreateInterviewKitDto, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all interview kits for the authenticated user' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_interview_kit_dto_1.QueryInterviewKitDto, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single interview kit by ID' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Poll generation status for a kit' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Inline-edit sections of a generated kit' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "updateKit", null);
__decorate([
    (0, common_1.Put)(':id/scorecard'),
    (0, swagger_1.ApiOperation)({ summary: 'Save updated scorecard scores' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_interview_kit_dto_1.UpdateScorecardDto, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "updateScorecard", null);
__decorate([
    (0, common_1.Post)(':id/regenerate/:section'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ generation: { ttl: 3_600_000, limit: 20 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Regenerate a single section of the kit' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('section')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "regenerateSection", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get a shareable public link token for this kit' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "getShareToken", null);
__decorate([
    (0, common_1.Post)(':id/export/pdf'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ generation: { ttl: 3_600_000, limit: 20 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Export kit to PDF' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "exportPdf", null);
__decorate([
    (0, common_1.Post)(':id/export/docx'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ generation: { ttl: 3_600_000, limit: 20 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Export kit to DOCX (Word document)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "exportDocx", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Duplicate an existing kit' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete an interview kit' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InterviewKitController.prototype, "remove", null);
exports.InterviewKitController = InterviewKitController = __decorate([
    (0, swagger_1.ApiTags)('interview-kit'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('interview-kit'),
    __metadata("design:paramtypes", [interview_kit_service_1.InterviewKitService])
], InterviewKitController);
let PublicKitController = class PublicKitController {
    constructor(kitService) {
        this.kitService = kitService;
    }
    getSharedKit(token) {
        return this.kitService.findByShareToken(token);
    }
};
exports.PublicKitController = PublicKitController;
__decorate([
    (0, common_1.Get)('kit/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Access a shared kit by public token (no auth required)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicKitController.prototype, "getSharedKit", null);
exports.PublicKitController = PublicKitController = __decorate([
    (0, swagger_1.ApiTags)('public'),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [interview_kit_service_1.InterviewKitService])
], PublicKitController);
//# sourceMappingURL=interview-kit.controller.js.map