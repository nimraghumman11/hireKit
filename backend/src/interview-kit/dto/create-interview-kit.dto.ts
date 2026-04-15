import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInterviewKitDto {
  @ApiProperty({
    description: 'Plain language description of the role written by the hiring manager',
    example: 'We need a senior React developer to lead our frontend team. They will mentor junior devs, work closely with product and design, and own the architecture of our customer-facing dashboard. Must know TypeScript and have experience with performance optimization.',
  })
  @IsString()
  @MinLength(20, { message: 'Please provide a more detailed role description (at least 20 characters)' })
  description: string;
}
