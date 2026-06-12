import { defineField, defineType } from 'sanity';

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 5, validation: (Rule) => Rule.required() }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: false }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'createdAt', title: 'Created At', type: 'datetime', validation: (Rule) => Rule.required() })
  ]
});
