import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { Document } from '@/modules/iam/domain/entities/document.entity';
import { DocumentId } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-id';

export abstract class DocumentReadRepository {
  abstract getAll(
    pagination_params?: PaginationParams,
    filter?: string,
  ): Promise<Pagination<Document> | Document[]>;
  abstract getOneById(id: DocumentId): Promise<Document | null>;
}
