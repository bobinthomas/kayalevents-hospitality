import { renderToBuffer } from "@react-pdf/renderer";
import { ItineraryPdfDocument } from "./itinerary-pdf-document";
import type { ItinerarySchema, ResponseData } from "@/lib/itinerary-schema";

export function generateFormPdfBuffer(params: {
  artistName: string;
  eventName: string;
  schema: ItinerarySchema;
  responseData: ResponseData;
}): Promise<Buffer> {
  return renderToBuffer(
    <ItineraryPdfDocument
      artistName={params.artistName}
      eventName={params.eventName}
      schema={params.schema}
      responseData={params.responseData}
    />
  );
}
