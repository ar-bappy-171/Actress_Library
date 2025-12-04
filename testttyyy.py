import json
import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
from datetime import datetime
import threading

class JSONFileMergerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("JSON File Merger - Enhanced")
        self.root.geometry("800x600")
        self.root.resizable(True, True)
        
        # Initialize merger
        self.merger = JSONFileMerger()
        self.input_files = []
        
        self.setup_ui()
        
    def setup_ui(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(3, weight=1)
        
        # Title
        title_label = ttk.Label(main_frame, text="JSON File Merger - Enhanced", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # Input files section
        input_frame = ttk.LabelFrame(main_frame, text="Input Files", padding="10")
        input_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        input_frame.columnconfigure(1, weight=1)
        
        # Add files button
        ttk.Button(input_frame, text="Add Files", 
                  command=self.add_files).grid(row=0, column=0, padx=(0, 10))
        
        # Clear files button
        ttk.Button(input_frame, text="Clear All", 
                  command=self.clear_files).grid(row=0, column=2, padx=(10, 0))
        
        # File counter
        self.file_count_label = ttk.Label(input_frame, text="No files selected")
        self.file_count_label.grid(row=0, column=1, padx=10)
        
        # File list
        file_list_frame = ttk.Frame(main_frame)
        file_list_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        file_list_frame.columnconfigure(0, weight=1)
        
        ttk.Label(file_list_frame, text="Selected Files:").grid(row=0, column=0, sticky=tk.W)
        
        self.file_listbox = tk.Listbox(file_list_frame, height=6)
        self.file_listbox.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(5, 0))
        
        # Scrollbar for file list
        scrollbar = ttk.Scrollbar(file_list_frame, orient=tk.VERTICAL, command=self.file_listbox.yview)
        scrollbar.grid(row=1, column=1, sticky=(tk.N, tk.S))
        self.file_listbox.configure(yscrollcommand=scrollbar.set)
        
        # Remove selected file button
        ttk.Button(file_list_frame, text="Remove Selected", 
                  command=self.remove_selected_file).grid(row=2, column=0, sticky=tk.W, pady=(5, 0))
        
        # Output file section
        output_frame = ttk.LabelFrame(main_frame, text="Output File", padding="10")
        output_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        output_frame.columnconfigure(1, weight=1)
        
        ttk.Label(output_frame, text="Save Location:").grid(row=0, column=0, sticky=tk.W)
        
        self.output_var = tk.StringVar()
        output_entry = ttk.Entry(output_frame, textvariable=self.output_var, state='readonly')
        output_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(10, 10))
        
        ttk.Button(output_frame, text="Choose Location", 
                  command=self.choose_output_location).grid(row=0, column=2)
        
        # Settings section
        settings_frame = ttk.LabelFrame(main_frame, text="Merge Settings", padding="10")
        settings_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        settings_frame.columnconfigure(1, weight=1)
        
        # Image base path
        ttk.Label(settings_frame, text="Image Base Path:").grid(row=0, column=0, sticky=tk.W)
        
        self.image_base_var = tk.StringVar(value="images/actresses")
        image_entry = ttk.Entry(settings_frame, textvariable=self.image_base_var)
        image_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(10, 10))
        
        # Preserve metadata option
        self.preserve_meta_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(settings_frame, text="Preserve original metadata (views, dates, tags)", 
                       variable=self.preserve_meta_var).grid(row=1, column=0, columnspan=2, sticky=tk.W, pady=(5, 0))
        
        # Merge button
        self.merge_button = ttk.Button(main_frame, text="Merge Files", 
                                      command=self.start_merge, style="Accent.TButton")
        self.merge_button.grid(row=5, column=0, columnspan=3, pady=20)
        
        # Progress bar
        self.progress = ttk.Progressbar(main_frame, mode='indeterminate')
        self.progress.grid(row=6, column=0, columnspan=3, sticky=(tk.W, tk.E))
        
        # Status label
        self.status_label = ttk.Label(main_frame, text="Ready - Select files and choose save location")
        self.status_label.grid(row=7, column=0, columnspan=3)
        
        # Results section
        results_frame = ttk.LabelFrame(main_frame, text="Merge Results", padding="10")
        results_frame.grid(row=8, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(10, 0))
        results_frame.columnconfigure(0, weight=1)
        results_frame.rowconfigure(0, weight=1)
        main_frame.rowconfigure(8, weight=1)
        
        self.results_text = scrolledtext.ScrolledText(results_frame, height=10, wrap=tk.WORD)
        self.results_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure style for accent button
        style = ttk.Style()
        style.configure("Accent.TButton", foreground='white', background='#0078D7')
        
        # Initially disable merge button
        self.merge_button.state(['disabled'])
    
    def add_files(self):
        files = filedialog.askopenfilenames(
            title="Select JSON/TXT files to merge",
            filetypes=[("JSON files", "*.json"), ("Text files", "*.txt"), ("All files", "*.*")]
        )
        
        if files:
            for file in files:
                if file not in self.input_files:
                    self.input_files.append(file)
                    self.file_listbox.insert(tk.END, os.path.basename(file))
            
            self.update_file_count()
            self.update_merge_button_state()
    
    def choose_output_location(self):
        filename = filedialog.asksaveasfilename(
            title="Choose where to save merged file",
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            initialfile="merged_output.txt"
        )
        
        if filename:
            self.output_var.set(filename)
            self.status_label.config(text=f"Will save to: {filename}")
            self.update_merge_button_state()
    
    def remove_selected_file(self):
        selection = self.file_listbox.curselection()
        if selection:
            index = selection[0]
            self.input_files.pop(index)
            self.file_listbox.delete(index)
            self.update_file_count()
            self.update_merge_button_state()
    
    def clear_files(self):
        self.input_files.clear()
        self.file_listbox.delete(0, tk.END)
        self.update_file_count()
        self.update_merge_button_state()
    
    def update_file_count(self):
        count = len(self.input_files)
        self.file_count_label.config(text=f"{count} file(s) selected")
    
    def update_merge_button_state(self):
        """Enable merge button only when we have files AND a save location"""
        has_files = len(self.input_files) >= 1  # Changed to 1 to allow single file processing
        has_output = bool(self.output_var.get().strip())
        
        if has_files and has_output:
            self.merge_button.state(['!disabled'])
            self.status_label.config(text="Ready to merge files!")
        else:
            self.merge_button.state(['disabled'])
            
            if not has_files and not has_output:
                self.status_label.config(text="Select files and choose save location")
            elif not has_files:
                self.status_label.config(text="Select files to merge")
            else:
                self.status_label.config(text="Choose where to save the merged file")
    
    def start_merge(self):
        if len(self.input_files) < 1:
            messagebox.showwarning("Warning", "Please select at least 1 file to merge.")
            return
        
        output_file = self.output_var.get().strip()
        if not output_file:
            messagebox.showwarning("Warning", "Please choose where to save the merged file.")
            return
        
        # Disable UI during merge
        self.set_ui_state(False)
        self.progress.start()
        self.status_label.config(text="Merging files...")
        
        # Get settings from user input
        image_base_path = self.image_base_var.get().strip()
        if not image_base_path:
            image_base_path = "images/actresses"
        
        preserve_metadata = self.preserve_meta_var.get()
        
        # Run merge in separate thread to prevent UI freezing
        thread = threading.Thread(target=self.perform_merge, args=(output_file, image_base_path, preserve_metadata))
        thread.daemon = True
        thread.start()
    
    def perform_merge(self, output_file, image_base_path, preserve_metadata):
        try:
            success = self.merger.merge_files(self.input_files, output_file, image_base_path, preserve_metadata)
            
            # Update UI in main thread
            self.root.after(0, self.merge_complete, success, output_file)
            
        except Exception as e:
            self.root.after(0, self.merge_error, str(e))
    
    def merge_complete(self, success, output_file):
        self.progress.stop()
        self.set_ui_state(True)
        
        if success:
            self.status_label.config(text=f"Merge completed successfully!")
            
            # Display results
            results = self.merger.get_merge_summary()
            self.results_text.delete(1.0, tk.END)
            self.results_text.insert(tk.END, results)
            
            # Show success message with file location
            messagebox.showinfo(
                "Success", 
                f"Files merged successfully!\n\n"
                f"Saved to: {output_file}\n\n"
                f"Total items merged: {len(self.merger.merged_data)}"
            )
            
            # Open the containing folder
            self.open_containing_folder(output_file)
        else:
            self.status_label.config(text="Merge failed!")
            messagebox.showerror("Error", "Failed to merge files. Check the console for details.")
    
    def open_containing_folder(self, filepath):
        """Open the folder containing the merged file"""
        try:
            folder_path = os.path.dirname(filepath)
            if os.name == 'nt':  # Windows
                os.startfile(folder_path)
            elif os.name == 'posix':  # macOS, Linux
                if os.uname().sysname == 'Darwin':  # macOS
                    os.system(f'open "{folder_path}"')
                else:  # Linux
                    os.system(f'xdg-open "{folder_path}"')
        except Exception as e:
            print(f"Could not open folder: {e}")
    
    def merge_error(self, error_msg):
        self.progress.stop()
        self.set_ui_state(True)
        self.status_label.config(text="Merge error!")
        messagebox.showerror("Error", f"An error occurred during merge:\n{error_msg}")
    
    def set_ui_state(self, enabled):
        state = "normal" if enabled else "disabled"
        self.merge_button.config(state=state)

class JSONFileMerger:
    def __init__(self):
        self.merged_data = []
        
    def extract_slug_from_filename(self, filename):
        base_name = os.path.splitext(filename)[0]
        slug = ''.join(c for c in base_name if c.isalnum() or c in ['-', '_']).lower()
        return slug
    
    def extract_name_from_filename(self, filename):
        base_name = os.path.splitext(filename)[0]
        name = base_name.replace('-', ' ').replace('_', ' ').title()
        return name
    
    def read_json_file(self, filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read().strip()
                if content.startswith('{') and content.endswith('}'):
                    return json.loads(content)
                elif content.startswith('[') and content.endswith(']'):
                    return json.loads(content)
                else:
                    print(f"Warning: Invalid JSON format in {filepath}")
                    return None
        except json.JSONDecodeError as e:
            print(f"Error parsing {filepath}: {e}")
            return None
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            return None
    
    def process_file(self, filepath, filename, image_base_path, preserve_metadata):
        data = self.read_json_file(filepath)
        if not data:
            return None
        
        slug = self.extract_slug_from_filename(filename)
        name = self.extract_name_from_filename(filename)
        
        # Handle both single objects and arrays
        items_to_process = []
        if isinstance(data, list):
            items_to_process = data
        else:
            items_to_process = [data]
        
        processed_items = []
        
        for item_data in items_to_process:
            if not isinstance(item_data, dict):
                continue
            
            # Use existing slug if available, otherwise generate from filename
            existing_slug = item_data.get('slug')
            if existing_slug and preserve_metadata:
                slug = existing_slug
            else:
                slug = self.extract_slug_from_filename(filename)
            
            # Use existing name if available, otherwise generate from filename
            existing_name = item_data.get('name')
            if existing_name and preserve_metadata:
                name = existing_name
            else:
                name = self.extract_name_from_filename(filename)
            
            # Start with original data if preserving metadata
            if preserve_metadata:
                merged_item = item_data.copy()
            else:
                merged_item = {}
            
            # Set basic fields (override if not preserving or if missing)
            merged_item["slug"] = slug
            merged_item["name"] = name
            
            if not preserve_metadata or "category" not in merged_item:
                merged_item["category"] = "onlyfans"
            
            # Handle thumb path
            if not preserve_metadata or "thumb" not in merged_item or merged_item["thumb"].startswith("https://via.placeholder.com"):
                if "thumb" in item_data and item_data["thumb"].startswith("http"):
                    # Keep existing URL thumbs
                    merged_item["thumb"] = item_data["thumb"]
                else:
                    # Generate local thumb path
                    merged_item["thumb"] = f"{image_base_path}/{slug}/thumb.jpg"
            
            # Handle gallery paths
            if "gallery" in item_data:
                gallery_with_paths = []
                for gallery_item in item_data["gallery"]:
                    if gallery_item.startswith("http"):
                        # Keep URL images
                        gallery_with_paths.append(gallery_item)
                    else:
                        # Convert to proper local path
                        gallery_with_paths.append(f"{image_base_path}/{slug}/{gallery_item}")
                merged_item["gallery"] = gallery_with_paths
            
            # Handle websites
            if "websites" in item_data and (not preserve_metadata or "websites" not in merged_item):
                merged_item["websites"] = item_data["websites"]
            
            # Handle tags
            if "tags" in item_data and (not preserve_metadata or "tags" not in merged_item):
                merged_item["tags"] = item_data["tags"]
            
            # Set creation date if not preserving or if missing
            if not preserve_metadata or "createdAt" not in merged_item:
                merged_item["createdAt"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000Z")
            
            # Preserve views and lastViewed if they exist
            if preserve_metadata:
                if "views" in item_data:
                    merged_item["views"] = item_data["views"]
                if "lastViewed" in item_data:
                    merged_item["lastViewed"] = item_data["lastViewed"]
            
            processed_items.append(merged_item)
        
        return processed_items
    
    def merge_files(self, input_files, output_file, image_base_path="images/actresses", preserve_metadata=True):
        print(f"Starting to merge {len(input_files)} files...")
        self.merged_data = []
        
        for filepath in input_files:
            filename = os.path.basename(filepath)
            print(f"Processing: {filename}")
            
            processed_items = self.process_file(filepath, filename, image_base_path, preserve_metadata)
            if processed_items:
                self.merged_data.extend(processed_items)
                print(f"✓ Successfully processed: {filename} ({len(processed_items)} items)")
            else:
                print(f"✗ Failed to process: {filename}")
        
        # Remove duplicates based on slug
        seen_slugs = set()
        unique_data = []
        for item in self.merged_data:
            if item["slug"] not in seen_slugs:
                seen_slugs.add(item["slug"])
                unique_data.append(item)
        
        self.merged_data = unique_data
        
        # Sort by creation date (newest first)
        self.merged_data.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(output_file) if os.path.dirname(output_file) else '.', exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as file:
                json.dump(self.merged_data, file, indent=2, ensure_ascii=False)
            print(f"\n✓ Successfully merged {len(self.merged_data)} items into: {output_file}")
            return True
        except Exception as e:
            print(f"✗ Error writing output file: {e}")
            return False
    
    def get_merge_summary(self):
        summary = f"=== Merge Summary ===\n"
        summary += f"Total items merged: {len(self.merged_data)}\n\n"
        
        for item in self.merged_data:
            summary += f"• {item['name']} ({item['slug']})\n"
            summary += f"  Category: {item.get('category', 'N/A')}\n"
            summary += f"  Thumb: {item.get('thumb', 'N/A')}\n"
            summary += f"  Websites: {len(item.get('websites', []))}\n"
            summary += f"  Gallery: {len(item.get('gallery', []))}\n"
            summary += f"  Views: {item.get('views', 'N/A')}\n"
            summary += f"  Created: {item.get('createdAt', 'N/A')}\n\n"
        
        return summary

def main():
    root = tk.Tk()
    app = JSONFileMergerGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()