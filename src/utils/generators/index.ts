import { Category } from '../../interfaces/Category';
import { GeneratedCategory } from '../../interfaces/GeneratedCategory';
import { Page } from '../../interfaces/Page';

export function generateCategoriesJSON(categories: Category[]): GeneratedCategory[] {
    return categories.map((category) => {
        return {
            name: category.name,
            pages: category.pages.map((page) => {
                return {
                    slug: page.slug,
                    title: page.title,
                    author: page.author,
                    lastChangedBy: page.lastChangedBy,
                    lastChangedAt: page.lastChangedAt,
                };
            }),
        };
    });
}

export function generatePage(page: Page): string {
    return `import { DocumentationLayout } from "../../../src/components/layouts/DocumentationLayout";
            export const meta = {
              title: '${page.title}',
              author: '${page.author}',
              lastChangedBy: '${page.lastChangedBy}',
              lastChangedAt: ${page.lastChangedAt},
            };
      
            ${page.content}

      
            export default ({ children }) => <DocumentationLayout meta={meta}>{children}</DocumentationLayout>
    `;
}