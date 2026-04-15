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
exports.CreateInterviewKitDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateInterviewKitDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { description: { required: true, type: () => String, minLength: 20 } };
    }
}
exports.CreateInterviewKitDto = CreateInterviewKitDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Plain language description of the role written by the hiring manager',
        example: 'We need a senior React developer to lead our frontend team. They will mentor junior devs, work closely with product and design, and own the architecture of our customer-facing dashboard. Must know TypeScript and have experience with performance optimization.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(20, { message: 'Please provide a more detailed role description (at least 20 characters)' }),
    __metadata("design:type", String)
], CreateInterviewKitDto.prototype, "description", void 0);
//# sourceMappingURL=create-interview-kit.dto.js.map