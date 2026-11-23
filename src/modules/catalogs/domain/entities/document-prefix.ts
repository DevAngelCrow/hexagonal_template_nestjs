import { DocumentPrefixActive } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-active';
import { DocumentPrefixCode } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-code';
import { DocumentPrefixCurrentValue } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-current-value';
import { DocumentPrefixCurrentYear } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-current-year';
import { DocumentPrefixDescription } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-description';
import { DocumentPrefixEntityTarget } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-entity-target';
import { DocumentPrefixId } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-id';
import { DocumentPrefixName } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-name';
import { DocumentPrefixPadding } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-padding';
import { DocumentPrefixPrefix } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-prefix';
import { DocumentPrefixResetYearly } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-reset-yearly';
import { DocumentPrefixSeparator } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-separator';

export class DocumentPrefix {
  constructor(
    private readonly code: DocumentPrefixCode,
    private readonly prefix: DocumentPrefixPrefix,
    private readonly name: DocumentPrefixName,
    private readonly entity_target: DocumentPrefixEntityTarget,
    private readonly padding: DocumentPrefixPadding,
    private readonly reset_yearly: DocumentPrefixResetYearly,
    private readonly separator: DocumentPrefixSeparator,
    private readonly current_value: DocumentPrefixCurrentValue,
    private readonly active: DocumentPrefixActive,
    private readonly description?: DocumentPrefixDescription,
    private readonly current_year?: DocumentPrefixCurrentYear,
    private readonly id?: DocumentPrefixId,
  ) {}

  static create(data: {
    id?: string;
    code: string;
    prefix: string;
    name: string;
    description?: string | null;
    entity_target: string;
    padding?: number;
    reset_yearly?: boolean;
    separator?: string;
    current_value?: number;
    current_year?: number | null;
    active: boolean;
  }): DocumentPrefix {
    return new DocumentPrefix(
      new DocumentPrefixCode(data.code),
      new DocumentPrefixPrefix(data.prefix),
      new DocumentPrefixName(data.name),
      new DocumentPrefixEntityTarget(data.entity_target),
      new DocumentPrefixPadding(data.padding ?? 4),
      new DocumentPrefixResetYearly(data.reset_yearly ?? true),
      new DocumentPrefixSeparator(data.separator ?? '-'),
      new DocumentPrefixCurrentValue(data.current_value ?? 0),
      new DocumentPrefixActive(data.active),
      new DocumentPrefixDescription(data.description),
      new DocumentPrefixCurrentYear(data.current_year),
      data.id ? new DocumentPrefixId(data.id) : undefined,
    );
  }

  public getId(): DocumentPrefixId | undefined {
    return this.id;
  }

  public getCode(): DocumentPrefixCode {
    return this.code;
  }

  public getPrefix(): DocumentPrefixPrefix {
    return this.prefix;
  }

  public getName(): DocumentPrefixName {
    return this.name;
  }

  public getDescription(): DocumentPrefixDescription | undefined {
    return this.description;
  }

  public getEntityTarget(): DocumentPrefixEntityTarget {
    return this.entity_target;
  }

  public getCurrentYear(): DocumentPrefixCurrentYear | undefined {
    return this.current_year;
  }

  public getCurrentValue(): DocumentPrefixCurrentValue {
    return this.current_value;
  }

  public getPadding(): DocumentPrefixPadding {
    return this.padding;
  }

  public getResetYearly(): DocumentPrefixResetYearly {
    return this.reset_yearly;
  }

  public getSeparator(): DocumentPrefixSeparator {
    return this.separator;
  }

  public getActive(): DocumentPrefixActive {
    return this.active;
  }
}

