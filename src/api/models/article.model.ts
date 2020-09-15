import FileModel from './file.model';
import Model from '../abstract/model';
import LoggerService from '../service/logger.service';

export const CONTENT_IDENTIFIER_PUBLISHERID = 'publisher-id';
export const CONTENT_IDENTIFIER_DOI = 'doi';

export interface Person {
  type: 'Person',
  familyNames: Array<string>,
  givenNames: Array<string>,
}

export interface ArticleAuthor extends Person {
  affiliations: Array<{
    type: string,
    address: {
      type: string,
      addressCountry: string,
      addressLocality?: string
    },
    name: string
  }>
  emails?: Array<string>,
}

export interface ImageObjectContent {
  type: 'ImageObject',
  contentUrl: string,
  format: string,
  meta: {
    inline: boolean
  }
}

export interface TableCellContent {
  type: 'TableCell'
  content: Array<string | ArticleContents>
  rowSpan?: string | number,
  colSpan?: string | number,
}

export interface TableRowContent {
  type: 'TableRow'
  cells: Array<TableCellContent>
  rowType?: string,
}

export interface TableDescription {
  type?: string,
  id?: string,
  content: Array<ArticleContents>,
}

export interface TableContent {
  type: 'Table',
  id?: string,
  label: string,
  caption: Array<string | ArticleContents>,
  rows: Array<TableRowContent>,
  description: Array<TableDescription>,
}

export interface ArticleContents {
  type: string,
  label?: string,
  content?: Array<string | ArticleContents | ImageObjectContent>,
  caption?: Array<string | ArticleContents>,
  id?: string,
  target?: string,
  relation?: string,
  depth?: number,
}

export interface ArticleDatePublished {
  type: string,
  value: string,
}

export interface ArticlePartOf {
  type: string,
  isPartOf?: ArticlePartOf,
  volumeNumber?: string | number,
  identifiers?: Array<ArticleIdentifier>,
  issns?: Array<string>,
  publisher?: ArticlePartOfPublisher,
  title?: string,
  name?: string,
  issueNumber?: string | number,
}

export interface ArticleIdentifier {
  type: string,
  name: string,
  propertyID: string,
  value: string
}

export interface ArticlePartOfPublisher {
  type: string,
  name: string,
}

export interface ArticleAbout {
  type: string,
  name: string,
}

export interface ArticleLicense {
  type: string,
  url: string,
  content: Array<ArticleContents>
}

export interface ArticleReference {
  type: string,
  id: string,
  title?: string,
  pageEnd?: number,
  pageStart?: number,
  datePublished: string,
  authors: Array<Person>
  isPartOf?: ArticlePartOf
}

export interface ArticleMeta {
  authorNotes?: Array<string | ArticleContents>
}

export interface Article {
  type: string,
  title: string,
  authors: Array<ArticleAuthor>,
  about: Array<ArticleAbout>,
  description: Array<ArticleContents>,
  content: Array<ArticleContents | TableContent | ImageObjectContent>,
  datePublished: ArticleDatePublished,
  isPartOf: ArticlePartOf,
  identifiers: Array<ArticleIdentifier>,
  keywords: Array<string>,
  licenses: Array<ArticleLicense>,
  references: Array<ArticleReference>,
  meta?: ArticleMeta,
  genre: Array<string>,
  pageStart: string | number,
  pageEnd: string | number,
}

export interface ArticleModelData {
  article: Article,
  files: Array<FileModel>
}

class ArticleModel extends Model {
  private Type: string;

  private Title: string;

  private Authors: Array<ArticleAuthor>;

  private About: Array<ArticleAbout>;

  private Description: Array<ArticleContents>;

  private Content: Array<ArticleContents | TableContent | ImageObjectContent>;

  private DatePublished: ArticleDatePublished;

  private IsPartOf: ArticlePartOf;

  private Identifiers: Array<ArticleIdentifier>;

  private Keywords: Array<string>;

  private Licenses: Array<ArticleLicense>;

  private References: Array<ArticleReference>;

  private Meta: ArticleMeta;

  private Genre: Array<string>;

  private PageStart: string | number;

  private PageEnd: string | number;

  private OriginalData: Article;

  private Files: Array<FileModel>;

  constructor(logger: LoggerService, data: ArticleModelData) {
    super(logger);

    this.Type = data.article.type;
    this.Title = data.article.title;
    this.Authors = data.article.authors;
    this.About = data.article.about;
    this.Description = data.article.description;
    this.Content = data.article.content;
    this.DatePublished = data.article.datePublished;
    this.IsPartOf = data.article.isPartOf;
    this.Identifiers = data.article.identifiers;
    this.Keywords = data.article.keywords;
    this.Licenses = data.article.licenses;
    this.References = data.article.references;
    this.Meta = data.article.meta ?? {};
    this.Genre = data.article.genre;
    this.PageStart = data.article.pageStart;
    this.PageEnd = data.article.pageEnd;
    this.OriginalData = data.article;
    this.Files = data.files;
  }

  get type(): string {
    return this.Type;
  }

  get title(): string {
    return this.Title;
  }

  get authors(): Array<ArticleAuthor> {
    return this.Authors;
  }

  get description(): Array<ArticleContents> {
    return this.Description;
  }

  get content(): Array<ArticleContents | TableContent | ImageObjectContent> {
    return this.Content;
  }

  get datePublished(): ArticleDatePublished {
    return this.DatePublished;
  }

  get isPartOf(): ArticlePartOf {
    return this.IsPartOf;
  }

  get identifiers(): Array<ArticleIdentifier> {
    return this.Identifiers;
  }

  get keywords(): Array<string> {
    return this.Keywords;
  }

  get licenses(): Array<ArticleLicense> {
    return this.Licenses;
  }

  get references(): Array<ArticleReference> {
    return this.References;
  }

  get meta(): ArticleMeta {
    return this.Meta;
  }

  get genre(): Array<string> {
    return this.Genre;
  }

  get pageStart(): string | number {
    return this.PageStart;
  }

  get pageEnd(): string | number {
    return this.PageEnd;
  }

  get originalData(): Article {
    return this.OriginalData;
  }

  get files(): Array<FileModel> {
    return this.Files;
  }

  getArticleIdentifier(name: string): string | null {
    const articleIdentifier = this.Identifiers.filter(
      (identifier) => identifier.name === name,
    );

    if (articleIdentifier[0] && articleIdentifier[0].value) {
      return articleIdentifier[0].value;
    }

    return null;
  }

  getDOI(): string | null {
    return this.getArticleIdentifier(CONTENT_IDENTIFIER_DOI);
  }

  getPublisherID(): string | null {
    return this.getArticleIdentifier(CONTENT_IDENTIFIER_PUBLISHERID);
  }
}

export default ArticleModel;