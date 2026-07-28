-- CreateTable
CREATE TABLE "RoomStation" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomStation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomStation_roomId_idx" ON "RoomStation"("roomId");

-- CreateIndex
CREATE INDEX "RoomStation_station_idx" ON "RoomStation"("station");

-- AddForeignKey
ALTER TABLE "RoomStation" ADD CONSTRAINT "RoomStation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
