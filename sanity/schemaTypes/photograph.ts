import { defineField, defineType } from 'sanity';

export const photograph = defineType({
  name: 'photograph',
  title: 'Photograph',
  type: 'document',
  fields: [
    defineField({ name: 'imageCode', title: 'Image Code', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: false }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'aspectRatio', title: 'Aspect Ratio', type: 'number', validation: (Rule) => Rule.required().positive() }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'location', title: 'Location', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'isPrintAvailable', title: 'Print Available', type: 'boolean', initialValue: true }),
    defineField({ name: 'priceTierId', title: 'Price Tier ID', type: 'string' }),
    defineField({ name: 'project', title: 'Project', type: 'reference', to: [{ type: 'project' }] }),
    defineField({ name: 'createdAt', title: 'Created At', type: 'datetime', validation: (Rule) => Rule.required() })
  ]
});
