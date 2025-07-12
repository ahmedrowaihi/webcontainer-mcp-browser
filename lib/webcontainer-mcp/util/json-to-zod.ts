import { z } from "zod"
import type { ZodTypeAny, ZodSchema } from "zod"


export const mcpjsonSchemaToZodSchema = (schema: any, requiredList: string[], keyName: string): ZodSchema<any> => {
    if (schema.type === 'object' && schema.properties) {
        const zodShape: Record<string, ZodTypeAny> = {}
        for (const key in schema.properties) {
            zodShape[key] = mcpjsonSchemaToZodSchema(schema.properties[key], requiredList, key)
        }
        if (typeof schema.additionalProperties === 'object' && Object.keys(schema.additionalProperties).length > 0) {
            return z.object(zodShape).catchall(mcpjsonSchemaToZodSchema(schema.additionalProperties, [], keyName))
        }
        if (schema.additionalProperties === false) {
            return z.object(zodShape).strict()
        }
        return z.object(zodShape).passthrough()
    }
    if (schema.type === 'object') {
        return z.record(z.any())
    }
    if (schema.oneOf || schema.anyOf) {
        const schemas = schema.oneOf || schema.anyOf
        const zodSchemas = schemas.map((subSchema: any) => mcpjsonSchemaToZodSchema(subSchema, requiredList, keyName))
        return z.union(zodSchemas).describe(schema?.description ?? schema?.title ?? keyName)
    }
    if (schema.enum) {
        return requiredList.includes(keyName)
            ? z.enum(schema.enum).describe(schema?.description ?? schema?.title ?? keyName)
            : z
                  .enum(schema.enum)
                  .describe(schema?.description ?? schema?.title ?? keyName)
                  .optional()
    }
    if (schema.type === 'string') {
        return requiredList.includes(keyName)
            ? z.string({ required_error: `${keyName} required` }).describe(schema?.description ?? keyName)
            : z
                  .string()
                  .describe(schema?.description ?? keyName)
                  .optional()
    }
    if (schema.type === 'array') {
        return z.array(mcpjsonSchemaToZodSchema(schema.items, requiredList, keyName))
    }
    if (schema.type === 'boolean') {
        return requiredList.includes(keyName)
            ? z.boolean({ required_error: `${keyName} required` }).describe(schema?.description ?? keyName)
            : z
                  .boolean()
                  .describe(schema?.description ?? keyName)
                  .optional()
    }
    if (schema.type === 'number') {
        let numberSchema = z.coerce.number()
        if (typeof schema.minimum === 'number') {
            numberSchema = numberSchema.min(schema.minimum)
        }
        if (typeof schema.maximum === 'number') {
            numberSchema = numberSchema.max(schema.maximum)
        }
        return requiredList.includes(keyName)
            ? numberSchema.describe(schema?.description ?? keyName)
            : numberSchema.describe(schema?.description ?? keyName).optional()
    }
    if (schema.type === 'integer') {
        let numberSchema = z.coerce.number().int()
        return requiredList.includes(keyName)
            ? numberSchema.describe(schema?.description ?? keyName)
            : numberSchema.describe(schema?.description ?? keyName).optional()
    }
    if (schema.type === 'null') {
        return z.null()
    }
    return z.unknown().describe(schema?.description ?? keyName)
}