"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewKitModule = void 0;
const common_1 = require("@nestjs/common");
const interview_kit_controller_1 = require("./interview-kit.controller");
const interview_kit_service_1 = require("./interview-kit.service");
const ai_module_1 = require("../ai/ai.module");
let InterviewKitModule = class InterviewKitModule {
};
exports.InterviewKitModule = InterviewKitModule;
exports.InterviewKitModule = InterviewKitModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_module_1.AiModule],
        controllers: [interview_kit_controller_1.InterviewKitController, interview_kit_controller_1.PublicKitController],
        providers: [interview_kit_service_1.InterviewKitService],
        exports: [interview_kit_service_1.InterviewKitService],
    })
], InterviewKitModule);
//# sourceMappingURL=interview-kit.module.js.map