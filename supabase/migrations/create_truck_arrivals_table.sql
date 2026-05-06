-- Create truck_arrivals table
CREATE TABLE IF NOT EXISTS truck_arrivals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_registration TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  vehicle_size TEXT NOT NULL,
  load_type TEXT NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_truck_arrivals_warehouse_id ON truck_arrivals(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_truck_arrivals_client_id ON truck_arrivals(client_id);
CREATE INDEX IF NOT EXISTS idx_truck_arrivals_arrival_time ON truck_arrivals(arrival_time);

-- Add trigger to update updated_at column
CREATE TRIGGER update_truck_arrivals_timestamp
BEFORE UPDATE ON truck_arrivals
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Enable Row Level Security (RLS)
ALTER TABLE truck_arrivals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth setup)
-- Policy to allow users to see their own truck arrivals
CREATE POLICY "Users can view their own truck arrivals"
  ON truck_arrivals
  FOR SELECT
  USING (auth.uid() = client_id);

-- Policy to allow users to insert their own truck arrivals
CREATE POLICY "Users can insert their own truck arrivals"
  ON truck_arrivals
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Policy to allow users to update their own truck arrivals
CREATE POLICY "Users can update their own truck arrivals"
  ON truck_arrivals
  FOR UPDATE
  USING (auth.uid() = client_id);

-- Policy to allow users to delete their own truck arrivals
CREATE POLICY "Users can delete their own truck arrivals"
  ON truck_arrivals
  FOR DELETE
  USING (auth.uid() = client_id);


