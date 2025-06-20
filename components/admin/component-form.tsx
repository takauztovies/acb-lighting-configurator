"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

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
