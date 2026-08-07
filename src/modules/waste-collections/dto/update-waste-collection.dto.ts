import { PartialType } from '@nestjs/swagger';
import { CreateWasteCollectionDto } from './create-waste-collection.dto';

export class UpdateWasteCollectionDto extends PartialType(CreateWasteCollectionDto) {}
