import { PartialType } from '@nestjs/swagger';
import { CreateWasteCategoryDto } from './create-waste-category.dto';

export class UpdateWasteCategoryDto extends PartialType(CreateWasteCategoryDto) {}
