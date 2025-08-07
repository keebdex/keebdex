import omit from 'lodash.omit'

export const omitSensitive = (obj: any) => omit(obj, ['fts'])
