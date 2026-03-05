"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GripVertical,
  ImagePlus,
  Plus,
  Star,
  Trash2,
  CheckCircle2,
  MousePointerClick,
  FolderOpen,
  Loader2,
} from "lucide-react";
import ImageCropper from "@/components/ui/ImageCropper";
import Image from "next/image";
import { MediaLibraryDialog } from "@/components/media/MediaLibraryDialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CarouselImage } from "../shared/types";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { uploadEventImage } from "@/lib/utils/uploadEventImage";
import { createClient } from "@/lib/supabase/client";

/*  Helpers  */
let _idSeq = 0;
const genId = () => `cimg-${Date.now()}-${_idSeq++}`;

/*  Sortable grid item  */
function SortableGridItem({
  image,
  index,
  onRemove,
  onCropClick,
  selectMode,
  isSelected,
  onToggleSelect,
}: {
  image: CarouselImage;
  index: number;
  onRemove: () => void;
  onCropClick: () => void;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const isMobile = useIsMobile();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/item relative aspect-square overflow-hidden rounded-lg border bg-muted cursor-pointer"
      onClick={
        selectMode ? onToggleSelect : image.uploading ? undefined : onCropClick
      }
    >
      {image.uploading ? (
        <div className="flex h-full items-center justify-center">
          <Skeleton className="absolute inset-0" />
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground z-10" />
        </div>
      ) : (
        <Image
          src={image.url}
          alt={index === 0 ? "Thumbnail" : `Photo ${index + 1}`}
          fill
          className="object-cover"
          draggable={false}
        />
      )}

      {/* Drag handle (disabled in select mode or uploading) */}
      {!selectMode && !image.uploading && (
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        />
      )}

      {/* Selection overlay */}
      {selectMode && isSelected && (
        <div className="absolute inset-0 bg-primary/20 ring-2 ring-inset ring-primary rounded-lg" />
      )}

      {/* Selection checkbox */}
      {selectMode && (
        <div className="absolute right-1.5 top-1.5 z-10">
          <CheckCircle2
            className={`h-5 w-5 drop-shadow ${isSelected ? "text-primary fill-primary-foreground" : "text-white/70"}`}
          />
        </div>
      )}

      {/* Thumbnail badge */}
      {index === 0 && !image.uploading && (
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
          <Star className="h-2.5 w-2.5" />
          {!isMobile && "Thumbnail"}
        </span>
      )}
      {index > 0 && !image.uploading && (
        <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-medium text-white">
          {index + 1}
        </span>
      )}

      {/* Delete button (hidden in select mode or uploading) */}
      {!selectMode && !image.uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/*  Sortable list item (mobile)  */
function SortableListItem({
  image,
  index,
  onRemove,
  onCropClick,
  selectMode,
  isSelected,
  onToggleSelect,
}: {
  image: CarouselImage;
  index: number;
  onRemove: () => void;
  onCropClick: () => void;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border p-2 ${selectMode && isSelected ? "border-primary bg-primary/10" : "bg-muted/40"}`}
      onClick={selectMode ? onToggleSelect : undefined}
    >
      {/* Drag grip (hidden in select mode or uploading) */}
      {!selectMode && !image.uploading && (
        <div
          {...attributes}
          {...listeners}
          className="flex shrink-0 cursor-grab touch-none items-center text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      {/* Selection checkbox */}
      {selectMode && (
        <div className="flex shrink-0 items-center">
          <CheckCircle2
            className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground/40"}`}
          />
        </div>
      )}

      {/* Image preview */}
      <div
        className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md"
        onClick={selectMode || image.uploading ? undefined : onCropClick}
      >
        {image.uploading ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="absolute inset-0" />
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground z-10" />
          </div>
        ) : (
          <Image
            src={image.url}
            alt={index === 0 ? "Thumbnail" : `Photo ${index + 1}`}
            fill
            className="object-cover"
            draggable={false}
          />
        )}
      </div>

      {/* Label */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {image.uploading ? (
          <span className="text-xs text-muted-foreground">Uploading…</span>
        ) : index === 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
            <Star className="h-3 w-3" />
            Thumbnail
          </span>
        ) : (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 text-xs font-medium">
            {index + 1}
          </span>
        )}
      </div>

      {/* Delete (hidden in select mode or uploading) */}
      {!selectMode && !image.uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/*  Main dialog shell  */
interface ImageManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: CarouselImage[];
  onConfirm: (images: CarouselImage[]) => void;
  /** Event ID for scoped uploads */
  eventId: string;
  maxImages?: number;
}

export function ImageManagerDialog({
  open,
  onOpenChange,
  images,
  onConfirm,
  eventId,
  maxImages = 10,
}: ImageManagerDialogProps) {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-4xl"
    >
      {open && (
        <ImageManagerContent
          images={images}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
          eventId={eventId}
          maxImages={maxImages}
        />
      )}
    </ResponsiveModal>
  );
}

/*  Inner content (remounts each open)  */
function ImageManagerContent({
  images,
  onConfirm,
  onOpenChange,
  eventId,
  maxImages = 10,
}: {
  images: CarouselImage[];
  onConfirm: (images: CarouselImage[]) => void;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  maxImages?: number;
}) {
  const [localImages, setLocalImages] = useState<CarouselImage[]>(() =>
    images.map((img) => ({ ...img })),
  );

  /* Which image index is being cropped (null = grid view) */
  const [cropTargetIndex, setCropTargetIndex] = useState<number | null>(null);
  const [pendingCropSrc, setPendingCropSrc] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCropping = cropTargetIndex !== null && pendingCropSrc !== null;

  /* Select mode */
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* Media library dialog */
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  /* ── Upload files immediately to event storage ── */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      const files = Array.from(fileList);
      e.target.value = "";

      const remaining = maxImages - localImages.length;
      const toUpload = files.slice(0, remaining);

      // Create placeholder entries with uploading=true
      const placeholders: CarouselImage[] = toUpload.map(() => ({
        id: genId(),
        url: "",
        uploading: true,
      }));

      setLocalImages((prev) => [...prev, ...placeholders]);

      // Upload each file and replace the placeholder
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        const placeholderId = placeholders[i].id;

        try {
          const url = await uploadEventImage(eventId, "images", file);
          setLocalImages((prev) =>
            prev.map((img) =>
              img.id === placeholderId
                ? { ...img, url, uploading: false }
                : img,
            ),
          );
        } catch (err) {
          console.error("Upload failed:", err);
          setLocalImages((prev) =>
            prev.filter((img) => img.id !== placeholderId),
          );
        }
      }
    },
    [localImages.length, maxImages, eventId],
  );

  /* ── Select from media library ── */
  const handleMediaSelect = useCallback(
    (urls: string[]) => {
      const remaining = maxImages - localImages.length;
      const toAdd = urls.slice(0, remaining).map((url) => ({
        id: genId(),
        url,
      }));
      setLocalImages((prev) => [...prev, ...toAdd]);
    },
    [localImages.length, maxImages],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isMobile = useIsMobile();

  /*  DnD  */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalImages((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id);
      const newIdx = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  /*  Click to crop / re-crop an existing image  */
  const openCropFor = useCallback((index: number) => {
    setLocalImages((prev) => {
      const img = prev[index];
      if (!img.url || img.uploading) return prev;
      setPendingCropSrc(img.url);
      setCropTargetIndex(index);
      setCroppedFile(null);
      return prev;
    });
  }, []);

  const handleCropComplete = useCallback((file: File) => {
    setCroppedFile(file);
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (!croppedFile || cropTargetIndex === null) return;

    const targetId = localImages[cropTargetIndex]?.id;

    // Mark the image as uploading
    setLocalImages((prev) =>
      prev.map((img) =>
        img.id === targetId ? { ...img, uploading: true } : img,
      ),
    );

    // Close crop view
    setCropTargetIndex(null);
    setPendingCropSrc(null);
    setCroppedFile(null);

    try {
      const url = await uploadEventImage(
        eventId,
        "images",
        croppedFile,
        `event-photo-cropped.png`,
      );

      setLocalImages((prev) =>
        prev.map((img) =>
          img.id === targetId ? { ...img, url, uploading: false } : img,
        ),
      );
    } catch (err) {
      console.error("Crop upload failed:", err);
      setLocalImages((prev) =>
        prev.map((img) =>
          img.id === targetId ? { ...img, uploading: false } : img,
        ),
      );
    }
  }, [croppedFile, cropTargetIndex, eventId, localImages]);

  const handleCropCancel = useCallback(() => {
    setCropTargetIndex(null);
    setPendingCropSrc(null);
    setCroppedFile(null);
  }, []);

  /** Delete a file from Supabase storage given its public URL (best-effort) */
  const deleteFromStorage = useCallback((url: string) => {
    try {
      const match = url.match(/\/media\/(.+)$/);
      if (!match) return;
      const path = decodeURIComponent(match[1]);
      const supabase = createClient();
      supabase.storage
        .from("media")
        .remove([path])
        .then(({ error }) => {
          if (error)
            console.error("[ImageManager] storage delete error:", error);
        });
    } catch {
      // Best-effort cleanup
    }
  }, []);

  /*  Remove  */
  const handleRemove = useCallback(
    (index: number) => {
      setLocalImages((prev) => {
        const removed = prev[index];
        // Delete the file from storage if it was newly uploaded (not in the original set)
        if (removed?.url && !images.some((img) => img.url === removed.url)) {
          deleteFromStorage(removed.url);
        }
        return prev.filter((_, i) => i !== index);
      });
    },
    [images, deleteFromStorage],
  );

  /* Bulk delete also cleans up storage */
  const handleBulkDeleteWithCleanup = useCallback(() => {
    const toDelete = localImages.filter((img) => selectedIds.has(img.id));
    for (const img of toDelete) {
      if (img.url && !images.some((orig) => orig.url === img.url)) {
        deleteFromStorage(img.url);
      }
    }
    setLocalImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  }, [selectedIds, localImages, images, deleteFromStorage]);

  /*  Confirm / Cancel  */
  const hasUploading = localImages.some((img) => img.uploading);

  const handleConfirm = useCallback(() => {
    const confirmed = localImages.filter((img) => !img.uploading && img.url);
    onConfirm(confirmed);
    onOpenChange(false);
  }, [localImages, onConfirm, onOpenChange]);

  const handleCancel = useCallback(() => {
    // Clean up any images that were uploaded in this session but not in the original set
    const originalUrls = new Set(images.map((img) => img.url));
    for (const img of localImages) {
      if (img.url && !img.uploading && !originalUrls.has(img.url)) {
        deleteFromStorage(img.url);
      }
    }
    onOpenChange(false);
  }, [onOpenChange, localImages, images, deleteFromStorage]);

  /*  Crop view  */
  if (isCropping) {
    return (
      <>
        <div className="flex flex-col space-y-1.5 sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Edit Photo
          </h2>
          <p className="text-sm text-muted-foreground">
            Adjust crop, then click Apply
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <ImageCropper
            imageSrc={pendingCropSrc!}
            onCropComplete={handleCropComplete}
            aspectRatio={1}
            shape="rect"
            fileName={`event-photo-${cropTargetIndex! + 1}.png`}
          />
        </div>
        <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleCropCancel}>
            Cancel
          </Button>
          <Button onClick={handleCropConfirm} disabled={!croppedFile}>
            Apply
          </Button>
        </div>
      </>
    );
  }

  /*  Grid view  */
  return (
    <>
      <div className="flex items-center justify-between sm:text-left">
        <div className="flex flex-col space-y-1.5">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Manage Photos
          </h2>
        </div>
        {localImages.length > 0 && (
          <div className="flex items-center gap-2">
            {selectMode && selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteWithCleanup}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete {selectedIds.size} Image
                {selectedIds.size !== 1 ? "s" : ""}
              </Button>
            )}
            {!selectMode && localImages.length < maxImages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMediaLibraryOpen(true)}
                className="gap-1.5"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Library
              </Button>
            )}
            <Button
              variant={selectMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setSelectMode((prev) => !prev);
                setSelectedIds(new Set());
              }}
              className="gap-1.5"
            >
              <MousePointerClick className="h-3.5 w-3.5" />
              {selectMode ? "Cancel" : "Select"}
            </Button>
          </div>
        )}
      </div>

      <div className="max-h-[60vh] overflow-y-auto py-2">
        {localImages.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localImages.map((i) => i.id)}
              strategy={
                isMobile ? verticalListSortingStrategy : rectSortingStrategy
              }
            >
              {isMobile ? (
                /* ── Mobile: vertical list ── */
                <div className="flex flex-col gap-2">
                  {localImages.map((img, i) => (
                    <SortableListItem
                      key={img.id}
                      image={img}
                      index={i}
                      onRemove={() => handleRemove(i)}
                      onCropClick={() => openCropFor(i)}
                      selectMode={selectMode}
                      isSelected={selectedIds.has(img.id)}
                      onToggleSelect={() => toggleSelect(img.id)}
                    />
                  ))}
                  {localImages.length < maxImages && (
                    <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border py-4 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Plus className="mr-2 h-5 w-5" />
                      <span className="text-sm font-medium">Add photo</span>
                    </label>
                  )}
                </div>
              ) : (
                /* ── Desktop: grid ── */
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {localImages.map((img, i) => (
                    <SortableGridItem
                      key={img.id}
                      image={img}
                      index={i}
                      onRemove={() => handleRemove(i)}
                      onCropClick={() => openCropFor(i)}
                      selectMode={selectMode}
                      isSelected={selectedIds.has(img.id)}
                      onToggleSelect={() => toggleSelect(img.id)}
                    />
                  ))}
                  {localImages.length < maxImages && (
                    <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Plus className="h-6 w-6" />
                    </label>
                  )}
                </div>
              )}
            </SortableContext>
          </DndContext>
        ) : (
          <>
            <label className="flex cursor-pointer flex-col items-center justify-center py-12 text-muted-foreground transition-colors hover:text-foreground">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <ImagePlus className="mb-3 h-12 w-12" />
              <p className="text-sm font-medium">No photos yet</p>
              <p className="text-xs">
                Click to upload up to {maxImages} photos
              </p>
            </label>
            <div className="flex justify-center -mt-8 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMediaLibraryOpen(true)}
                className="gap-1.5"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Choose from Media Library
              </Button>
            </div>
          </>
        )}
      </div>
      <p className="flex flex-col justify-center items-center text-sm text-muted-foreground mb-2">
        {selectMode ? (
          `${selectedIds.size} of ${localImages.length} selected`
        ) : isMobile ? (
          <>
            <span>
              {localImages.length}/{maxImages} photos
            </span>
            <span className="ml-1">
              Drag to reorder · Click a photo to crop
            </span>
          </>
        ) : (
          `${localImages.length}/${maxImages} photos · Drag to reorder · Click a photo to crop`
        )}
      </p>

      <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={hasUploading}>
          {hasUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            "Done"
          )}
        </Button>
      </div>

      <MediaLibraryDialog
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        defaultTab="images"
        multiSelect
        onSelect={handleMediaSelect}
      />
    </>
  );
}
