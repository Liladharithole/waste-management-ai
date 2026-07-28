# Swagger & API Documentation Rules

## 📖 What is Swagger / OpenAPI?

**Swagger** (OpenAPI) is an interactive API documentation platform automatically built and served from your codebase.

- **Swagger UI URL**: [http://localhost:7001/api](http://localhost:7001/api)
- **Spec Output**: Generates a standard JSON specification listing all endpoints, authentication schemes, schemas, and parameters.

---

## 🛠️ How to Document New Features in Swagger

To keep the Swagger documentation always up-to-date, every new controller and DTO must be decorated with `@nestjs/swagger` decorators.

### 1. Documenting Controllers (`@ApiTags()`, `@ApiOperation()`)

Group endpoints by logical business units and document each route action.

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateWasteRecordDto } from './dto/create-waste-record.dto';
import { WasteRecordEntity } from './entities/waste-record.entity';

@ApiTags('waste-records') // Groups this controller in the Swagger UI sidebar
@Controller('api/v1/waste-records')
export class WasteRecordsController {
  @Post()
  @ApiOperation({ summary: 'Create a new waste record' })
  @ApiResponse({ status: 201, description: 'Record created successfully', type: WasteRecordEntity })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() dto: CreateWasteRecordDto) {
    return this.service.create(dto);
  }
}
```

### 2. Documenting DTOs & Entities (`@ApiProperty()`)

Define parameter types, default values, examples, and constraints so the frontend team knows exactly what payload is expected.

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateWasteRecordDto {
  @ApiProperty({
    description: 'Category of waste (e.g. plastic, organic, paper)',
    example: 'plastic',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Total weight of waste in kilograms',
    example: 12.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  weightKg: number;
}
```

---

## 🔒 Documenting Authenticated Endpoints

If a controller or route requires authentication, decorate it with `@ApiBearerAuth()` so the Swagger UI displays the authorization lock icon:

```typescript
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth() // Allows users to input JWT tokens in Swagger UI header
@Controller('profile')
export class ProfileController {}
```
