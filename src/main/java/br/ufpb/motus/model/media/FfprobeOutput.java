package br.ufpb.motus.model.media;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record FfprobeOutput(
        @JsonProperty("streams") List<StreamInfo> streams,
        @JsonProperty("format") FormatInfo format
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StreamInfo(
            @JsonProperty("codec_type") String codecType,
            @JsonProperty("codec_name") String codecName,
            @JsonProperty("width") Integer width,
            @JsonProperty("height") Integer height
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FormatInfo(
            @JsonProperty("duration") String duration,
            @JsonProperty("bit_rate") String bitRate,
            @JsonProperty("size") String size
    ) {}
}