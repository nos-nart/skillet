import SwiftUI
import AppKit

let inputPath = "/Users/nartnos/.gemini/antigravity/brain/a1bf1081-018e-41d4-b081-de2d545ff175/skillet_icon_flat_1787829605425.jpg"
let outputPath = "/Users/nartnos/Developer/work/skillet/public/icon.png"

guard let nsImage = NSImage(contentsOfFile: inputPath) else {
    print("Failed to load input image")
    exit(1)
}

struct IconView: View {
    let image: Image
    
    var body: some View {
        ZStack {
            // Shadow layer
            RoundedRectangle(cornerRadius: 92.25, style: .continuous)
                .fill(Color.black)
                .frame(width: 410, height: 410)
                .shadow(color: Color.black.opacity(0.3), radius: 14, x: 0, y: 12)
            
            // Image layer
            image
                .resizable()
                // Crop out the margins (16% crop on each side)
                .scaleEffect(1.0 / 0.68)
                .frame(width: 410, height: 410)
                .clipShape(RoundedRectangle(cornerRadius: 92.25, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 92.25, style: .continuous)
                        .strokeBorder(Color.black.opacity(0.1), lineWidth: 1)
                )
        }
        .frame(width: 512, height: 512)
    }
}

@MainActor
func renderIcon() {
    let view = IconView(image: Image(nsImage: nsImage))
    let renderer = ImageRenderer(content: view)
    renderer.scale = 1.0
    renderer.isOpaque = false
    
    guard let cgImage = renderer.cgImage else {
        print("Failed to render cgImage")
        exit(1)
    }
    
    let bitmapRep = NSBitmapImageRep(cgImage: cgImage)
    guard let pngData = bitmapRep.representation(using: .png, properties: [:]) else {
        print("Failed to convert to PNG")
        exit(1)
    }
    
    do {
        try pngData.write(to: URL(fileURLWithPath: outputPath))
        print("Successfully generated true SwiftUI squircle icon at: \(outputPath)")
    } catch {
        print("Failed to write output: \(error)")
        exit(1)
    }
}

Task { @MainActor in
    renderIcon()
    exit(0)
}

RunLoop.main.run()
