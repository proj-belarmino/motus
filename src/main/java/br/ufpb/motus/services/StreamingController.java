package br.ufpb.motus.services;

import br.ufpb.motus.services.StreamingService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stream")
public class StreamingController {

    private final StreamingService streamingService;

    public StreamingController(StreamingService streamingService) {
        this.streamingService = streamingService;
    }

    @GetMapping("/{mediaId}")
    public ResponseEntity<Resource> streamMedia(
            @PathVariable String mediaId,
            @RequestHeader HttpHeaders headers) {
        
        // Caminho de simulação (mock) temporário no seu Fedora para testarmos.
        // Você pode colocar qualquer vídeo .mp4 na sua pasta /tmp e renomeá-lo para sample.mp4
        String mockFilePath = "/tmp/sample.mp4";

        Resource mediaResource = streamingService.loadMediaAsResource(mockFilePath);

        // O Spring Boot cuida de Range Requests (Status 206) automaticamente ao retornar um Resource
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("video/mp4"))
                .body(mediaResource);
    }
}
