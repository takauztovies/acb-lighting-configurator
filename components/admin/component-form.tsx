"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { type ComponentData } from "@/lib/database"
import { SingleFileUpload } from "./single-file-upload"
import { ModelPreview } from "./model-preview"
import { db } from "@/lib/database"

const COMPONENT_TYPES = [
  "track", "spotlight", "connector", "power-supply", "shade", "diffuser", 
  "mounting", "accessory", "bulb", "driver", "sensor", "dimmer", "lamp", 
  "pendant", "ceiling", "wall", "floor", "table", "strip", "panel", 
  "downlight", "uplight"
] as const;

const componentFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  type: z.enum(COMPONENT_TYPES, {
    required_error: "Please select a component type.",
  }),
  price: z.coerce.number().min(0),
  scale: z.coerce.number().min(0.1).max(10),
  image: z.string().refine((val) => val === '' || val.startsWith('/') || z.string().url().safeParse(val).success, {
    message: "Must be a valid URL or file path"
  }).optional(),
  cardImage: z.string().refine((val) => val === '' || val.startsWith('/') || z.string().url().safeParse(val).success, {
    message: "Must be a valid URL or file path"
  }).optional(),
  model3d: z.string().refine((val) => val === '' || val.startsWith('/') || z.string().url().safeParse(val).success, {
    message: "Must be a valid URL or file path"
  }).optional(),
});

type ComponentFormValues = z.infer<typeof componentFormSchema>;

interface ComponentFormProps {
  onComponentSaved: (data: Partial<ComponentData>) => void | Promise<void>;
  editingComponent?: Partial<ComponentData>;
}

// 3D Model Preview Component for the form
function FormModelPreview({ modelUrl }: { modelUrl: string }) {
  const [modelData, setModelData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadModel = async () => {
    if (!modelUrl) return

    setIsLoading(true)
    setError(null)

    try {
      if (modelUrl.startsWith("db://")) {
        const fileId = modelUrl.replace("db://", "")
        const file = await db.getFile(fileId)
        if (file && file.data) {
          setModelData(file.data)
        } else {
          setError("Model file not found in database")
        }
      } else {
        // For direct URLs, we need to fetch and convert to data URL
        const response = await fetch(modelUrl)
        const blob = await response.blob()
        const reader = new FileReader()
        reader.onload = () => setModelData(reader.result as string)
        reader.readAsDataURL(blob)
      }
    } catch (err) {
      setError("Failed to load 3D model")
      console.error("Error loading 3D model:", err)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (modelUrl) {
      loadModel()
    } else {
      setModelData(null)
      setError(null)
    }
  }, [modelUrl])

  if (!modelUrl) return null

  if (isLoading) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded border flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading 3D model...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded border flex items-center justify-center">
        <div className="text-center text-red-500">
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  if (!modelData) return null

  return (
    <div className="w-full h-48 rounded border overflow-hidden">
      <ModelPreview
        modelData={modelData}
        filename={modelUrl.split('/').pop() || 'model.obj'}
        className="w-full h-full"
      />
    </div>
  )
}

export function ComponentForm({ onComponentSaved, editingComponent }: ComponentFormProps) {
  const form = useForm<ComponentFormValues>({
    resolver: zodResolver(componentFormSchema),
    defaultValues: {
      name: editingComponent?.name || "",
      type: editingComponent?.type as ComponentFormValues['type'] | undefined,
      price: editingComponent?.price || 0,
      scale: (editingComponent?.specifications as any)?.scale || 1,
      image: editingComponent?.image || "",
      cardImage: editingComponent?.cardImage || "",
      model3d: editingComponent?.model3d || "",
    },
  });

  const watchedModel3d = form.watch("model3d");

  function onSubmit(data: ComponentFormValues) {
    const componentData: Partial<ComponentData> = {
      id: editingComponent?.id,
      name: data.name,
      type: data.type,
      price: data.price,
      image: data.image,
      cardImage: data.cardImage,
      model3d: data.model3d,
      specifications: {
        ...(editingComponent?.specifications as any),
        scale: data.scale,
      },
      updatedAt: new Date(),
    };
    if (!editingComponent?.id) {
        componentData.createdAt = new Date();
    }

    onComponentSaved(componentData);
    
    toast({
      title: editingComponent ? "Component updated" : "Component created",
    });

    if (!editingComponent) {
      form.reset();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Component name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a component type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COMPONENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="scale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scale</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" {...field} />
              </FormControl>
              <FormDescription>
                Scale factor for the 3D model.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="model3d"
          render={({ field }) => (
            <FormItem>
              <FormLabel>3D Model</FormLabel>
              <FormControl>
                <SingleFileUpload
                  onUpload={(url) => field.onChange(url)}
                  accept=".obj"
                  label="Upload .obj model"
                />
              </FormControl>
              <FormDescription>
                Upload the .obj file for the component.
              </FormDescription>
              {field.value && <p className="text-xs text-gray-500 mt-1">Current: {field.value}</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* 3D Model Preview */}
        {watchedModel3d && (
          <div className="space-y-2">
            <FormLabel>3D Model Preview</FormLabel>
            <FormModelPreview modelUrl={watchedModel3d} />
          </div>
        )}

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail Image</FormLabel>
              <FormControl>
                <SingleFileUpload
                  onUpload={(url) => field.onChange(url)}
                  accept="image/*"
                  label="Upload thumbnail"
                />
              </FormControl>
              <FormDescription>
                Upload a thumbnail image for the component.
              </FormDescription>
              {field.value && <p className="text-xs text-gray-500 mt-1">Current: {field.value}</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cardImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Image</FormLabel>
              <FormControl>
                <SingleFileUpload
                  onUpload={(url) => field.onChange(url)}
                  accept="image/*"
                  label="Upload card image"
                />
              </FormControl>
              <FormDescription>
                Upload a detailed image for the component card.
              </FormDescription>
              {field.value && <p className="text-xs text-gray-500 mt-1">Current: {field.value}</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save component</Button>
      </form>
    </Form>
  )
}
